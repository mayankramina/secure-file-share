# First Time Setup Instructions

1. Clone the repository and navigate to project directory:

```bash
git clone https://github.com/mayankramina/secure-file-share.git
cd secure-file-share
```

2. Generate SSL certificates

```bash
mkdir -p frontend/certs
mkdir -p backend/certs

# Generate backend SSL certificate
openssl req -x509 -newkey rsa:4096 \
    -keyout backend/certs/key.pem \
    -out backend/certs/cert.pem \
    -days 365 -nodes \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
    -addext "subjectAltName = DNS:localhost,IP:127.0.0.1"

# Generate frontend SSL certificate
openssl req -x509 -newkey rsa:4096 \
    -keyout frontend/certs/key.pem \
    -out frontend/certs/cert.pem \
    -days 365 -nodes \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
    -addext "subjectAltName = DNS:localhost,IP:127.0.0.1"

echo "SSL certificates generated successfully!" 
```

3. Run the project:

```bash
# Build and start everything
docker-compose up --build

# Or in detached mode
docker-compose up -d --build
```

4. setup database and admin(in new terminal)

```bash
# Access the backend container
docker-compose exec backend bash

# Run migrations
python manage.py migrate

# Create a superuser (follow the prompts)
python manage.py createsuperuser

# Exit the container
exit
```
