import { decryptData, encryptData } from '../encryption';

describe('encryption utils', () => {
  const plaintext = 'Sensitive information!';

  it('should encrypt and decrypt data correctly', () => {
    const encrypted = encryptData(plaintext);
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(plaintext);
    const decrypted = decryptData(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should throw on invalid decryption', () => {
    expect(() => decryptData('invalid-ciphertext')).toThrow('Failed to decrypt data');
  });

  it('should throw on invalid encryption input', () => {
    // @ts-expect-error
    expect(() => encryptData(undefined)).toThrow('Failed to encrypt data');
  });
});
