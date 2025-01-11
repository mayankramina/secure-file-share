// Utility functions for converting between base64 and buffer
export const buf2base64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
export const base642buf = (base64) => Uint8Array.from(atob(base64), c => c.charCodeAt(0));

// Import RSA public key for encrypting AES key
export async function importRSAPublicKey(pemKey) {
  // Remove header, footer and newlines from PEM
  const pemContents = pemKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\n/g, '');

  // Convert base64 to buffer
  const binaryKey = base642buf(pemContents);

  // Import the key
  return await crypto.subtle.importKey(
    'spki',
    binaryKey,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );
}

// Generate AES key for file encryption
export async function generateAESKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt file with AES-GCM
export async function encryptFile(file, aesKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const fileBuffer = await file.arrayBuffer();
  
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    aesKey,
    fileBuffer
  );

  // Combine IV and encrypted content
  const resultBuffer = new Uint8Array(iv.length + encryptedContent.byteLength);
  resultBuffer.set(iv, 0);
  resultBuffer.set(new Uint8Array(encryptedContent), iv.length);
  
  return resultBuffer;
}

// Encrypt AES key with RSA public key
export async function encryptAESKey(aesKey, publicKey) {
  const exportedAesKey = await crypto.subtle.exportKey('raw', aesKey);
  const encryptedKey = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    publicKey,
    exportedAesKey
  );
  return buf2base64(encryptedKey);
} 