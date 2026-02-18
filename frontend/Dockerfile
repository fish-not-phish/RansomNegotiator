FROM oven/bun:1-alpine AS base

# Build arguments
ARG VERSION=latest
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BASE_URL

# Set version as label and environment variable
LABEL version=${VERSION}
ENV APP_VERSION=${VERSION}

# Install dependencies
WORKDIR /app
COPY package.json ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

# Build
RUN bun run build

# Expose port
EXPOSE 3000

# Run
CMD ["bun", "run", "start"]