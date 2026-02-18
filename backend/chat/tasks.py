"""
Celery tasks for async chat processing with sequential ordering per session.
"""
import json
import uuid
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from openai import OpenAI
import redis
from .models import ChatSession, Message
from .prompts import get_system_prompt


# Redis client for locks and result storage
redis_client = redis.from_url(settings.CELERY_BROKER_URL)


def acquire_lock(lock_name, timeout=600):
    """
    Acquire a Redis lock with the given name.
    Returns True if lock acquired, False otherwise.
    """
    lock_key = f"chat_lock:{lock_name}"
    # Try to set the lock with NX (only if not exists) and expiry
    acquired = redis_client.set(lock_key, "1", nx=True, ex=timeout)
    return acquired


def release_lock(lock_name):
    """
    Release the Redis lock.
    """
    lock_key = f"chat_lock:{lock_name}"
    redis_client.delete(lock_key)


def store_result(task_id, result):
    """
    Store task result in Redis for polling.
    """
    result_key = f"chat_result:{task_id}"
    # Store result with 5 minute expiry
    redis_client.set(result_key, json.dumps(result), ex=600)


def get_result(task_id):
    """
    Get task result from Redis.
    Returns None if not ready or expired.
    """
    result_key = f"chat_result:{task_id}"
    result_data = redis_client.get(result_key)
    if result_data:
        return json.loads(result_data)
    return None


@shared_task(bind=True)
def process_chat_message(self, session_id, message, history, api_key, base_url, model, group_name):
    """
    Process a chat message asynchronously with sequential ordering per session.

    Uses Redis lock to ensure messages for the same chat session are processed
    in the order they were received.
    """
    task_id = self.request.id
    lock_name = f"session_{session_id}"
    max_retries = 60  # Wait up to 60 seconds for lock
    retry_delay = 1   # Check every 1 second

    try:
        # Try to acquire lock for this session, with retry loop
        for attempt in range(max_retries):
            lock_acquired = acquire_lock(lock_name, timeout=600)
            if lock_acquired:
                break
            # Lock not acquired, wait and retry
            import time
            time.sleep(retry_delay)
        else:
            # Failed to acquire lock after max retries
            result = {
                'status': 'error',
                'task_id': task_id,
                'error': 'Timeout waiting for previous message to complete. Please try again.',
            }
            store_result(task_id, result)
            return result

        # Get or create session
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            return {
                'status': 'error',
                'task_id': task_id,
                'error': 'Chat session not found',
            }

        # Save user message to database
        user_message = Message.objects.create(
            session=session,
            role='user',
            content=message
        )

        # Build messages list for API
        client = OpenAI(api_key=api_key, base_url=base_url)

        # Check if this is the first message (no history)
        is_first_message = not history or len(history) == 0

        system_prompt = get_system_prompt(
            group_name,
            session.revenue or "$50M",
            session.company_name or "the victim's company",
            is_first_message=is_first_message
        )
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        if history:
            for msg in history:
                messages.append({
                    "role": msg.get('role', 'user'),
                    "content": msg.get('content', '')
                })

        # Add current message
        messages.append({"role": "user", "content": message})

        # Make API call
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=500,
            )
            response = completion.choices[0].message.content
        except Exception as e:
            return {
                'status': 'error',
                'task_id': task_id,
                'error': f'AI API error: {str(e)}',
            }

        # Save assistant response to database
        assistant_message = Message.objects.create(
            session=session,
            role='assistant',
            content=response
        )

        # Update session timestamp
        session.updated_at = timezone.now()
        session.save()

        # Store result for polling
        result = {
            'status': 'completed',
            'task_id': task_id,
            'response': response,
            'user_message_id': str(user_message.id),
            'assistant_message_id': str(assistant_message.id),
            'session_id': str(session.id),
            'group': group_name,
        }
        store_result(task_id, result)

        return result

    except Exception as e:
        result = {
            'status': 'error',
            'task_id': task_id,
            'error': str(e),
        }
        store_result(task_id, result)
        return result

    finally:
        # Always release the lock
        release_lock(lock_name)


@shared_task
def check_task_status(task_id):
    """
    Check the status of a task by its ID.
    Used for polling from the frontend.
    """
    result = get_result(task_id)
    if result:
        return result
    return {
        'status': 'processing',
        'task_id': task_id,
    }