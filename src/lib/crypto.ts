// AES-GCM con PBKDF2 para derivar clave del PIN.
// Si Web Crypto no está disponible, fallback a XOR simple (mejor que texto plano).

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

function base64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Cifra un string usando AES-GCM con PBKDF2.
 * Formato: base64(salt) ":" base64(iv) ":" base64(ciphertext)
 */
export async function encryptData(data: string, key: string): Promise<string> {
  try {
    if (!crypto?.subtle) throw new Error("Web Crypto unavailable");

    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const cryptoKey = await deriveKey(key, salt);

    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encoder.encode(data)
    );

    return [
      bufToBase64(salt),
      bufToBase64(iv),
      bufToBase64(ciphertext),
    ].join(":");
  } catch {
    // Fallback: XOR simple con hash de la clave (mejor que texto plano)
    return "xor:" + xorEncrypt(data, key);
  }
}

/**
 * Descifra un string cifrado con encryptData().
 * Si el formato no es válido o falla el descifrado, retorna el string original.
 */
export async function decryptData(encrypted: string, key: string): Promise<string> {
  try {
    if (encrypted.startsWith("xor:")) {
      return xorDecrypt(encrypted.slice(4), key);
    }

    if (!crypto?.subtle) throw new Error("Web Crypto unavailable");

    const parts = encrypted.split(":");
    if (parts.length !== 3) throw new Error("Invalid format");

    const salt = base64ToBuf(parts[0]);
    const iv = base64ToBuf(parts[1]);
    const ciphertext = base64ToBuf(parts[2]);
    const cryptoKey = await deriveKey(key, salt);

    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  } catch {
    // Si falla el descifrado, retornar el original para no perder datos
    return encrypted;
  }
}

// ── Fallback XOR ────────────────────────────────────────────────────────────

function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length === 0) {
    // Sin clave, aplicar XOR con un byte fijo (obfuscación mínima)
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] ^ 0x42;
    }
    return result;
  }
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
}

function xorEncrypt(data: string, key: string): string {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const keyBytes = encoder.encode(key);
  const xored = xorBytes(dataBytes, keyBytes);
  return bufToBase64(xored);
}

function xorDecrypt(b64Data: string, key: string): string {
  const dataBytes = base64ToBuf(b64Data);
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const xored = xorBytes(dataBytes, keyBytes);
  const decoder = new TextDecoder();
  return decoder.decode(xored);
}

// ── PBKDF2 hash (para PIN) ──────────────────────────────────────────────────

const PIN_SALT_LENGTH = 16;

export interface PinHash {
  hash: string;
  salt: string;
}

/**
 * Hashea un PIN usando PBKDF2 con 100,000 iteraciones + salt aleatorio.
 */
export async function hashPinPBKDF2(pin: string): Promise<PinHash> {
  const salt = crypto.getRandomValues(new Uint8Array(PIN_SALT_LENGTH));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hash = bufToBase64(bits);
  return { hash, salt: bufToBase64(salt) };
}

/**
 * Verifica un PIN contra un hash PBKDF2 almacenado.
 */
export async function verifyPinPBKDF2(
  pin: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const salt = base64ToBuf(storedSalt);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hash = bufToBase64(bits);
  return hash === storedHash;
}

/**
 * Migra un hash SHA-256 legacy a PBKDF2.
 * Retorna null si el PIN no coincide con el hash legacy.
 */
export async function migrateLegacyPin(
  pin: string,
  legacyHash: string
): Promise<PinHash | null> {
  // Verificar contra el hash SHA-256 legacy
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const legacyComputed = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (legacyComputed !== legacyHash) return null;

  return hashPinPBKDF2(pin);
}
