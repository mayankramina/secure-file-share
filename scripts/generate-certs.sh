#!/bin/bash

# Create separate directories for frontend and backend certificates
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

# Set appropriate permissions
chmod 644 backend/certs/cert.pem backend/certs/key.pem
chmod 644 frontend/certs/cert.pem frontend/certs/key.pem

echo "SSL certificates generated successfully!" 