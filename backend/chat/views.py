"""
RansomNegotiator API views - handles chat requests with OpenAI-compatible endpoints.
"""
import os
import json
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from openai import OpenAI
from .models import ChatSession, Message, generate_revenue
from .tasks import process_chat_message, check_task_status, get_result
from .prompts import get_system_prompt, load_behaviour


@login_required
def get_available_groups(request):
    """
    Get list of available ransomware groups.
    """
    behaviour_path = settings.BEHAVIOUR_PATH
    groups = []

    for filename in os.listdir(behaviour_path):
        if filename.endswith('_behaviour.txt'):
            group_name = filename.replace('_behaviour.txt', '')
            file_path = os.path.join(behaviour_path, filename)
            size = os.path.getsize(file_path)
            groups.append({
                'name': group_name,
                'size': size,
            })

    # Sort by size descending
    groups.sort(key=lambda x: x['size'], reverse=True)

    return JsonResponse({'groups': groups})


@login_required
@csrf_exempt
@require_http_methods(["GET"])
def list_chats(request):
    """
    List all chat sessions for the current user.
    """
    chats = ChatSession.objects.filter(user=request.user)
    chat_list = []
    for chat in chats:
        # Get first and last messages for preview
        messages = chat.messages.all()
        first_message = messages.first()
        last_message = messages.last()

        # Get first user message (skip assistant welcome message)
        first_user_message = None
        for msg in messages:
            if msg.role == 'user':
                first_user_message = msg
                break

        chat_list.append({
            'id': str(chat.id),
            'group_name': chat.group_name,
            'title': chat.title or f"Chat with {chat.group_name}",
            'message_count': chat.messages.count(),
            'first_message': first_user_message.content[:100] if first_user_message else "New Chat",
            'last_message': last_message.content[:100] if last_message else "",
            'created_at': chat.created_at.isoformat(),
            'updated_at': chat.updated_at.isoformat(),
        })
    return JsonResponse({'chats': chat_list})


@login_required
@csrf_exempt
@require_http_methods(["GET"])
def search_chats(request):
    """
    Search chat sessions by message content.
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse({'chats': []})

    # Search in message content
    matching_messages = Message.objects.filter(
        content__icontains=query
    ).select_related('session')

    # Get unique sessions from matching messages
    session_ids = matching_messages.values_list('session_id', flat=True).distinct()
    chats = ChatSession.objects.filter(id__in=session_ids, user=request.user)

    chat_list = []
    for chat in chats:
        last_message = chat.messages.last()
        # Get matching message content for context
        matching_msg = chat.messages.filter(content__icontains=query).first()
        chat_list.append({
            'id': str(chat.id),
            'group_name': chat.group_name,
            'title': chat.title or f"Chat with {chat.group_name}",
            'message_count': chat.messages.count(),
            'last_message': last_message.content[:100] if last_message else "",
            'matching_context': matching_msg.content[:200] if matching_msg else "",
            'created_at': chat.created_at.isoformat(),
            'updated_at': chat.updated_at.isoformat(),
        })

    return JsonResponse({'chats': chat_list})


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def create_chat(request):
    """
    Create a new chat session.
    """
    try:
        data = json.loads(request.body)
        group_name = data.get('group_name', '')
        api_key = data.get('api_key', '')
        base_url = data.get('base_url', settings.OPENAI_DEFAULT_BASE_URL)
        model = data.get('model', settings.OPENAI_DEFAULT_MODEL)

        if not group_name:
            return JsonResponse({'error': 'Group name is required'}, status=400)

        chat = ChatSession.objects.create(
            user=request.user,
            group_name=group_name,
            api_key=api_key,
            base_url=base_url,
            model=model,
            title=f"Chat with {group_name}",
        )

        return JsonResponse({
            'id': str(chat.id),
            'group_name': chat.group_name,
            'welcome_message': f"Welcome to the {group_name} negotiation chatroom.",
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON request'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@csrf_exempt
@require_http_methods(["GET"])
def get_chat(request, chat_id):
    """
    Get a specific chat session with all messages.
    """
    try:
        chat = ChatSession.objects.get(id=chat_id, user=request.user)
        messages = chat.messages.all()

        message_list = []
        for msg in messages:
            message_list.append({
                'id': str(msg.id),
                'role': msg.role,
                'content': msg.content,
                'created_at': msg.created_at.isoformat(),
            })

        return JsonResponse({
            'id': str(chat.id),
            'group_name': chat.group_name,
            'api_key': chat.api_key,
            'base_url': chat.base_url,
            'model': chat.model,
            'messages': message_list,
            'created_at': chat.created_at.isoformat(),
        })

    except ChatSession.DoesNotExist:
        return JsonResponse({'error': 'Chat not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@csrf_exempt
@require_http_methods(["DELETE"])
def delete_chat(request, chat_id):
    """
    Delete a chat session.
    """
    try:
        chat = ChatSession.objects.get(id=chat_id, user=request.user)
        chat.delete()
        return JsonResponse({'success': True})
    except ChatSession.DoesNotExist:
        return JsonResponse({'error': 'Chat not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def chat(request):
    """
    Handle chat messages - send to AI and return response.
    Supports OpenAI-compatible endpoints.
    Optionally saves to database if session_id provided.
    """
    try:
        data = json.loads(request.body)

        # Get configuration from request
        session_id = data.get('session_id')
        api_key = data.get('api_key', '')
        base_url = data.get('base_url', settings.OPENAI_DEFAULT_BASE_URL)
        model = data.get('model', settings.OPENAI_DEFAULT_MODEL)
        group_name = data.get('group_name', '')
        message = data.get('message', '')
        history = data.get('history', [])

        if not api_key:
            return JsonResponse({'error': 'API key is required'}, status=400)
        if not group_name:
            return JsonResponse({'error': 'Group name is required'}, status=400)
        if not message:
            return JsonResponse({'error': 'Message is required'}, status=400)

        # Get or create session
        session = None
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            except ChatSession.DoesNotExist:
                pass

        # Initialize OpenAI client with configurable base URL
        client = OpenAI(api_key=api_key, base_url=base_url)

        # Build messages list
        system_prompt = get_system_prompt(group_name)
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history (from request or database)
        if session and not history:
            # Load from database
            db_messages = session.messages.all()
            for msg in db_messages:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        elif history:
            # Use provided history
            for msg in history:
                messages.append({
                    "role": msg.get('role', 'user'),
                    "content": msg.get('content', '')
                })

        # Add current message
        messages.append({"role": "user", "content": message})

        # Send request to OpenAI-compatible API
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=500,
        )

        response = completion.choices[0].message.content

        # Save to database if session exists
        if session:
            # Save user message
            Message.objects.create(
                session=session,
                role='user',
                content=message
            )
            # Save assistant response
            Message.objects.create(
                session=session,
                role='assistant',
                content=response
            )
            # Update timestamp
            session.updated_at = timezone.now()
            session.save()

        return JsonResponse({
            'response': response,
            'group': group_name,
            'session_id': str(session.id) if session else None,
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON request'}, status=400)
    except FileNotFoundError as e:
        return JsonResponse({'error': str(e)}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def init_chat(request):
    """
    Initialize a new chat session - returns system prompt and welcome message.
    Creates a persistent session if requested.
    """
    try:
        data = json.loads(request.body)
        group_name = data.get('group_name', '')
        api_key = data.get('api_key', '')
        base_url = data.get('base_url', settings.OPENAI_DEFAULT_BASE_URL)
        model = data.get('model', settings.OPENAI_DEFAULT_MODEL)
        save_session = data.get('save_session', False)
        # Get company_name and revenue from request, or generate defaults
        company_name = data.get('company_name', '').strip()
        revenue = data.get('revenue', '').strip()

        if not group_name:
            return JsonResponse({'error': 'Group name is required'}, status=400)

        # Use provided values or generate defaults
        if not revenue:
            revenue = generate_revenue()

        if not company_name:
            company_name = "the victim's company"

        system_prompt = get_system_prompt(group_name, revenue, company_name, is_first_message=True)

        session_id = None
        if save_session:
            chat = ChatSession.objects.create(
                user=request.user,
                group_name=group_name,
                api_key=api_key,
                base_url=base_url,
                model=model,
                title=f"Chat with {group_name}",
                company_name=company_name,
                revenue=revenue,
            )
            session_id = str(chat.id)

        return JsonResponse({
            'system_prompt': system_prompt,
            'welcome_message': f"Hello. You've reached the {group_name} support chat. Your systems have been encrypted and your data has been exfiltrated. We are ready to discuss resolution. Do you have authorization to negotiate on behalf of your organization?",
            'group': group_name,
            'session_id': session_id,
            'revenue': revenue,
            'company_name': company_name,
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON request'}, status=400)
    except FileNotFoundError as e:
        return JsonResponse({'error': str(e)}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def chat_async(request):
    """
    Handle chat messages asynchronously - dispatches task and returns immediately.
    Use the returned task_id to poll for the response.
    Ensures sequential processing per chat session.
    """
    try:
        data = json.loads(request.body)

        # Get configuration from request
        session_id = data.get('session_id')
        api_key = data.get('api_key', '')
        base_url = data.get('base_url', settings.OPENAI_DEFAULT_BASE_URL)
        model = data.get('model', settings.OPENAI_DEFAULT_MODEL)
        group_name = data.get('group_name', '')
        message = data.get('message', '')
        history = data.get('history', [])

        if not api_key:
            return JsonResponse({'error': 'API key is required'}, status=400)
        if not group_name:
            return JsonResponse({'error': 'Group name is required'}, status=400)
        if not message:
            return JsonResponse({'error': 'Message is required'}, status=400)

        # Get or create session
        session = None
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            except ChatSession.DoesNotExist:
                return JsonResponse({'error': 'Chat session not found'}, status=404)
        else:
            # Create a new session if none provided
            session = ChatSession.objects.create(
                user=request.user,
                group_name=group_name,
                api_key=api_key,
                base_url=base_url,
                model=model,
                title=f"Chat with {group_name}",
            )

        # Dispatch the async task
        task = process_chat_message.delay(
            str(session.id),
            message,
            history,
            api_key,
            base_url,
            model,
            group_name
        )

        return JsonResponse({
            'task_id': task.id,
            'session_id': str(session.id),
            'status': 'processing',
            'message': 'Message queued. Poll for response using task_id.',
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON request'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@csrf_exempt
@require_http_methods(["GET"])
def chat_status(request, task_id):
    """
    Poll for the status of an async chat task.
    Returns the response when ready, or 'processing' status if not yet complete.
    """
    try:
        # Try to get result from Redis
        result = get_result(task_id)

        if result:
            return JsonResponse(result)

        # Check if task is still in Celery
        from celery.result import AsyncResult
        task_result = AsyncResult(task_id)

        if task_result.ready():
            # Task completed but no result in Redis (edge case)
            if task_result.successful():
                return JsonResponse(task_result.result)
            else:
                return JsonResponse({
                    'status': 'error',
                    'task_id': task_id,
                    'error': str(task_result.info),
                })

        # Task still processing
        return JsonResponse({
            'status': 'processing',
            'task_id': task_id,
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)