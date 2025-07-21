
// @ts-expect-error TS(2307): Cannot find module 'crypto-js' or its correspondin... Remove this comment to see the full error message
import { AES, enc } from 'crypto-js';
// If using TypeScript, install @types/crypto-js for better type safety.
// import.meta.env.VITE_ENCRYPTION_KEY is the standard for Vite projects.
// @ts-expect-error TS(1343): The 'import.meta' meta-property is only allowed wh... Remove this comment to see the full error message
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'FALLBACK_INSECURE_KEY';

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
