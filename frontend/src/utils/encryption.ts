// @ts-ignore
import { AES, enc } from 'crypto-js';
// TODO: Install @types/crypto-js or provide a proper type declaration for production.

// TODO: Replace with secure key from environment variable or config
const ENCRYPTION_KEY = 'REPLACE_WITH_SECURE_KEY';

export function encryptData(data: string): string {
  try {
    return AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    throw new Error('Failed to encrypt data');
  }
}

export function decryptData(encryptedData: string): string {
  try {
    const bytes = AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(enc.Utf8);
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}
