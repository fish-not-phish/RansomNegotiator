FROM python:3.13-slim

# Build argument for version
ARG VERSION=latest

# Set version as label and environment variable
LABEL version=${VERSION}
ENV APP_VERSION=${VERSION}

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install supervisor for process management
RUN pip install --no-cache-dir supervisor

# Copy application
COPY . .

# Copy supervisord configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create log directories
RUN mkdir -p /var/log

# Create entrypoint script
RUN echo '#!/bin/bash' > /entrypoint.sh && \
    echo 'echo "Running makemigrations..."' >> /entrypoint.sh && \
    echo 'python3 manage.py makemigrations --noinput' >> /entrypoint.sh && \
    echo 'echo "Running migrate..."' >> /entrypoint.sh && \
    echo 'python3 manage.py migrate --noinput' >> /entrypoint.sh && \
    echo 'echo "Starting supervisord..."' >> /entrypoint.sh && \
    echo 'exec supervisord -c /etc/supervisor/conf.d/supervisord.conf' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Expose port
EXPOSE 8000

# Run entrypoint
ENTRYPOINT ["/entrypoint.sh"]