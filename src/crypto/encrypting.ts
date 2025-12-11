import { gcm } from '@noble/ciphers/aes';
import { x25519 } from '@noble/curves/ed25519';
import { p256 } from '@noble/curves/p256';
import { p384 } from '@noble/curves/p384';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { encodePkcs8, encodeSpki, generateRawKeyPair, normalizeScheme, parseKey, parsePkcs8, parseSpki } from './common';
import { hkdf } from './hkdf';

export type EncryptingScheme = 'ecdhx25519_hkdfsha256_aes256gcm' | 'ecdhp256_hkdfsha256_aes256gcm' | 'ecdhp384_hkdfsha384_aes256gcm';

const CURVE_MAP: Record<string, 'x25519' | 'P-256' | 'P-384'> = {
    ecdhx25519_hkdfsha256_aes256gcm: 'x25519',
    ecdhp256_hkdfsha256_aes256gcm: 'P-256',
    ecdhp384_hkdfsha384_aes256gcm: 'P-384',
};

const HKDF_HASH_MAP: Record<string, 'sha256' | 'sha384'> = {
    ecdhx25519_hkdfsha256_aes256gcm: 'sha256',
    ecdhp256_hkdfsha256_aes256gcm: 'sha256',
    ecdhp384_hkdfsha384_aes256gcm: 'sha384',
};

function getCurve(scheme: string): 'x25519' | 'P-256' | 'P-384' {
    const normalized = normalizeScheme(scheme);
    if (!(normalized in CURVE_MAP)) throw new Error(`Unsupported encrypting scheme: ${scheme}`);
    return CURVE_MAP[normalized];
}

function getHkdfHash(scheme: string): 'sha256' | 'sha384' {
    const normalized = normalizeScheme(scheme);
    if (!(normalized in HKDF_HASH_MAP)) throw new Error(`Unsupported encrypting scheme: ${scheme}`);
    return HKDF_HASH_MAP[normalized];
}

async function deriveKeyAsync(
    scheme: string,
    localPrivateKey: Buffer | string,
    remotePublicKey: Buffer | string
): Promise<Buffer> {
    const normalized = normalizeScheme(scheme);
    const hkdfHash = getHkdfHash(scheme);
    const curve = getCurve(scheme);

    const localDer = parseKey(localPrivateKey);
    const remoteDer = parseKey(remotePublicKey);

    const localRaw = parsePkcs8(localDer, curve);
    const remoteRaw = parseSpki(remoteDer, curve);

    let sharedSecret: Uint8Array;
    if (curve === 'x25519') {
        sharedSecret = x25519.getSharedSecret(localRaw, remoteRaw);
    } else if (curve === 'P-256') {
        const secret = p256.getSharedSecret(localRaw, remoteRaw);
        sharedSecret = secret.slice(1); // Remove compression byte (02/03)
    } else { // P-384
        const secret = p384.getSharedSecret(localRaw, remoteRaw);
        sharedSecret = secret.slice(1); // Remove compression byte
    }

    // Use HKDF to derive the encryption key
    const derivedKey = hkdf(Buffer.from(sharedSecret), 32, {
        salt: Buffer.alloc(0),
        info: Buffer.from(normalized, 'utf8'),
        hash: hkdfHash
    });

    return derivedKey;
}

export function isSchemeSupported(scheme: string): boolean {
    return normalizeScheme(scheme) in CURVE_MAP;
}

export function generateKeyPair(scheme: string): { privateKeyPkcs8Der: Buffer; publicKeySpkiDer: Buffer } {
    const curve = getCurve(scheme);
    const { privateKey, publicKey } = generateRawKeyPair(curve);

    return {
        privateKeyPkcs8Der: encodePkcs8(privateKey, publicKey, curve),
        publicKeySpkiDer: encodeSpki(publicKey, curve),
    };
}

export async function encrypt(
    scheme: string,
    localPrivateKey: Buffer | string,
    remotePublicKey: Buffer | string,
    plaintext: Buffer,
    aad?: Buffer
): Promise<{ nonce: Buffer; ciphertext: Buffer }> {
    const key = await deriveKeyAsync(scheme, localPrivateKey, remotePublicKey);
    const nonce = Crypto.getRandomBytes(12);

    const cipher = gcm(key, nonce, aad);
    const result = cipher.encrypt(plaintext);

    return { nonce: Buffer.from(nonce), ciphertext: Buffer.from(result) };
}

export async function decrypt(
    scheme: string,
    localPrivateKey: Buffer | string,
    remotePublicKey: Buffer | string,
    nonce: Buffer,
    ciphertext: Buffer,
    aad?: Buffer
): Promise<Buffer> {
    const key = await deriveKeyAsync(scheme, localPrivateKey, remotePublicKey);

    const cipher = gcm(key, nonce, aad);
    const result = cipher.decrypt(ciphertext);

    return Buffer.from(result);
}
