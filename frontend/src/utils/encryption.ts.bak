import { AES, enc } from 'crypto-js';
/**
 * Utility functions for encrypting and decrypting data using AES encryption.
 *
 * Uses the VITE_ENCRYPTION_KEY from environment variables (Vite projects) or a fallback key.
 *
 * @module utils/encryption
 */
// If using TypeScript, install @types/crypto-js for better type safety.
// import.meta.env.VITE_ENCRYPTION_KEY is the standard for Vite projects.

function getEncryptionKey(): string {
  // Use only process.env for environment variables
  return process.env.VITE_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || 'FALLBACK_INSECURE_KEY';
}

/**
 * Encrypts a string using AES encryption.
 *
 * @param {string} _data - The plaintext data to encrypt.
 * @returns {string} The encrypted ciphertext (base64 encoded).
 * @throws {Error} If encryption fails.
 */
export function encryptData(_data: string): string {
  if (typeof _data !== 'string' || !_data) {
    throw new Error('Failed to encrypt data');
  }
  try {
    return AES.encrypt(_data, getEncryptionKey()).toString();
  } catch (error) {
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts an AES-encrypted string.
 *
 * @param {string} _encryptedData - The encrypted ciphertext (base64 encoded).
 * @returns {string} The decrypted plaintext string.
 * @throws {Error} If decryption fails.
 */
export function decryptData(_encryptedData: string): string {
  if (typeof _encryptedData !== 'string' || !_encryptedData) {
    throw new Error('Failed to decrypt data');
  }
  try {
    const _bytes = AES.decrypt(_encryptedData, getEncryptionKey());
    const decrypted = _bytes.toString(enc.Utf8);
    if (!decrypted) throw new Error();
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}
