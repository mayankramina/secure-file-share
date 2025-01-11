# Use official Python image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create directory for encrypted files
RUN mkdir -p encrypted_files

# Make manage.py executable
RUN chmod +x manage.py

EXPOSE 8000

# Change: Use absolute paths for cert and key
CMD ["python", "manage.py", "runsslserver", "0.0.0.0:8000", "--cert", "/app/certs/cert.pem", "--key", "/app/certs/key.pem"]
