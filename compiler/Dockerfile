FROM python:3.10-slim

# Set environment variables to non-interactive
ENV DEBIAN_FRONTEND=noninteractive

# Install compilers and runtimes
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    gcc \
    g++ \
    default-jdk \
    golang-go \
    rustc \
    ruby \
    php-cli \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript and ts-node globally for TS execution
RUN npm install -g typescript ts-node

# Set working directory
WORKDIR /app

# Copy dependency file and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY main.py .

# Expose Hugging Face Space default port
EXPOSE 7860

# Run FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
