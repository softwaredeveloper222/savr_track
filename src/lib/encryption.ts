import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.DOCUMENT_ENCRYPTION_KEY || process.env.JWT_SECRET || "savr-track-secret-key-change-in-production";
  // Derive a 32-byte key from whatever secret is available
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptBuffer(buffer: Buffer): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: [IV (16 bytes)] [Auth Tag (16 bytes)] [Encrypted Data]
  return Buffer.concat([iv, tag, encrypted]);
}

export function decryptBuffer(encryptedBuffer: Buffer): Buffer {
  const key = getEncryptionKey();

  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const tag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
