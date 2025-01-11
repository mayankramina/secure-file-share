
# ✅ Secure File Sharing Application  

This repository contains a **Client-Side E2EE secure file-sharing web application** designed for safe, efficient file uploads, downloads, and sharing.

---

## 🚀 First-Time Setup  

Follow these steps to set up and run the application:  

### 1. Clone the Repository  

```bash  
git clone https://github.com/mayankramina/secure-file-share.git  
cd secure-file-share  
```  

### 2. Generate SSL Certificates  

```bash  
# Create necessary directories  
mkdir -p frontend/certs backend/certs  

# Generate a single SSL certificate  
openssl req -x509 -newkey rsa:4096 \  
    -keyout temp_key.pem \  
    -out temp_cert.pem \  
    -days 365 -nodes \  
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \  
    -addext "subjectAltName = DNS:localhost,IP:127.0.0.1"  

# Copy the certificate and key to both frontend and backend  
cp temp_key.pem frontend/certs/key.pem  
cp temp_cert.pem frontend/certs/cert.pem  
cp temp_key.pem backend/certs/key.pem  
cp temp_cert.pem backend/certs/cert.pem  

# Remove temporary files  
rm temp_key.pem temp_cert.pem  
```  

### 3. Run the Application  

```bash  
# Build and start the application  
docker-compose up --build  

# To run in detached mode:  
docker-compose up -d --build  
```  

### 4. Configure the Database and Admin User  

```bash  
# Access the backend container  
docker-compose exec backend bash  

# Apply database migrations  
python manage.py migrate  

# Create a superuser (follow the prompts to set username and password)  
python manage.py createsuperuser  

# Exit the container  
exit  
```  

### 5. Access the Application  

- **Frontend**: [https://localhost:3000](https://localhost:3000)  
- **Backend**: [https://localhost:8000](https://localhost:8000)  
- **Admin Panel**: [https://localhost:8000/admin/](https://localhost:8000/admin/) (Ensure the trailing `/` is included)  

---

## 🌟 Features  

### ✅ **Multi-Factor Authentication (MFA)**  
Supports browser-session-specific TOTP-based MFA (e.g., Google Authenticator).  

### ✅ **Role-Based Access Control (RBAC)**  
- **Admin**: Full control over users and files ([Admin Panel](https://localhost:8000/admin/)).  
- **Regular User**: Upload, download, and share files.  
- **Guest**: View shared files with limited access.  

### ✅ **End-to-End Encrypted (Zero-Knowledge Encryption)**  
- There is seperate key management system to replicate trusted key management system.  
- File encryption, file decryption, keys and access to keys to other users are managed from the client side.
- Files are encrypted during transmission and at rest with AES-256 while server has zero knowledge about file's encryption.

### ✅ **Secure File Sharing**  
- Share files with specific users with configurable **view** or **download** permissions.  
- Generate one-time, secure links with expiration.  

---

## 🔒 Security Best Practices  

- ✅ SSL/TLS for secure connections. HTTPS traffic with self-signed certificates for local development.
- ✅ JWT-based authentication with secure and HttpOnly cookies.  
- ✅ Strong password hashing using bcrypt. 
- ✅ Input validation and sanitization to prevent malicious data entry.  
- ✅ Proper session management with JWT expiration.  

