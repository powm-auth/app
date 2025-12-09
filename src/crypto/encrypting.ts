import { Buffer } from 'buffer';
import { ec as EC } from 'elliptic';
import crypto, { KeyObject } from 'react-native-quick-crypto';
import { normalizeScheme, toKeyObject } from './common';
import { hkdf } from './hkdf';

export type EncryptingScheme = 'ecdhx25519_hkdfsha256_aes256gcm' | 'ecdhp256_hkdfsha256_aes256gcm' | 'ecdhp384_hkdfsha384_aes256gcm';

const CURVE_MAP: Record<string, 'x25519' | 'P-256' | 'P-384'> = {
    ecdhx25519_hkdfsha256_aes256gcm: 'x25519',
    ecdhp256_hkdfsha256_aes256gcm: 'P-256',
    ecdhp384_hkdfsha384_aes256gcm: 'P-384',
};

const CIPHER_MAP: Record<string, 'aes-256-gcm'> = {
    ecdhx25519_hkdfsha256_aes256gcm: 'aes-256-gcm',
    ecdhp256_hkdfsha256_aes256gcm: 'aes-256-gcm',
    ecdhp384_hkdfsha384_aes256gcm: 'aes-256-gcm',
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

function getCipher(scheme: string): string {
    const normalized = normalizeScheme(scheme);
    if (!(normalized in CIPHER_MAP)) throw new Error(`Unsupported encrypting scheme: ${scheme}`);
    return CIPHER_MAP[normalized];
}

function getHkdfHash(scheme: string): 'sha256' | 'sha384' {
    const normalized = normalizeScheme(scheme);
    if (!(normalized in HKDF_HASH_MAP)) throw new Error(`Unsupported encrypting scheme: ${scheme}`);
    return HKDF_HASH_MAP[normalized];
}

async function deriveKeyAsync(
    scheme: string,
    localPrivateKey: KeyObject,
    remotePublicKey: KeyObject
): Promise<Buffer> {
    const normalized = normalizeScheme(scheme);
    const hkdfHash = getHkdfHash(scheme);
    const curve = getCurve(scheme);

    let sharedSecret: Buffer;
    if (curve === 'x25519') {
        // X25519 ECDH using native crypto
        const result = crypto.diffieHellman({ privateKey: localPrivateKey, publicKey: remotePublicKey });
        sharedSecret = Buffer.from(result as any);
    } else {
        // For EC curves (P-256, P-384), use elliptic library
        const curveName = curve === 'P-256' ? 'p256' : 'p384';
        const ecCurve = new EC(curveName);

        // Export keys as DER and extract the raw key material
        const privateKeyDer = (localPrivateKey as any).export({ type: 'pkcs8', format: 'der' });
        const publicKeyDer = (remotePublicKey as any).export({ type: 'spki', format: 'der' });

        // Parse PKCS8 private key - need to parse ASN.1 structure properly
        // PKCS#8 has the actual private key inside an OCTET STRING
        // For P-256: Look for the pattern 04 20 (OCTET STRING, 32 bytes) followed by the key
        // For P-384: Look for the pattern 04 30 (OCTET STRING, 48 bytes) followed by the key
        const privateKeySize = curve === 'P-256' ? 32 : 48;
        const tag = curve === 'P-256' ? 0x20 : 0x30;

        // Find the OCTET STRING containing the private key (tag 0x04, length 0x20 or 0x30)
        let privateKeyBytes: Buffer | null = null;
        for (let i = 0; i < privateKeyDer.length - privateKeySize - 1; i++) {
            if (privateKeyDer[i] === 0x04 && privateKeyDer[i + 1] === tag) {
                privateKeyBytes = privateKeyDer.slice(i + 2, i + 2 + privateKeySize);
                break;
            }
        }

        if (!privateKeyBytes) {
            throw new Error('Could not parse private key from PKCS#8 DER');
        }

        // Parse SPKI public key - skip the header to get to the uncompressed point
        // The uncompressed point starts with 0x04 and is (keySize * 2 + 1) bytes
        const publicKeySize = curve === 'P-256' ? 65 : 97; // 1 + 32*2 or 1 + 48*2
        const publicKeyBytes = publicKeyDer.slice(-publicKeySize);

        // Create elliptic key objects
        const privKey = ecCurve.keyFromPrivate(privateKeyBytes);
        const pubKey = ecCurve.keyFromPublic(publicKeyBytes);

        // Compute shared secret
        const sharedPoint = privKey.derive(pubKey.getPublic());
        sharedSecret = Buffer.from(sharedPoint.toArray('be', privateKeySize));
    }

    // Use HKDF to derive the encryption key
    const hashAlgo = hkdfHash;
    const derivedKey = hkdf(sharedSecret, 32, {
        salt: Buffer.alloc(0),
        info: Buffer.from(normalized, 'utf8'),
        hash: hashAlgo
    });

    return derivedKey;
}

export function isSchemeSupported(scheme: string): boolean {
    return normalizeScheme(scheme) in CURVE_MAP;
}

export function generateKeyPair(scheme: string): { privateKey: Buffer; publicKeySpkiDer: Buffer } {
    const curve = getCurve(scheme);

    if (curve === 'x25519') {
        const { privateKey, publicKey } = crypto.generateKeyPairSync('x25519', {
            publicKeyEncoding: { type: 'spki', format: 'der' },
            privateKeyEncoding: { type: 'pkcs8', format: 'der' }
        });
        return {
            privateKey: Buffer.from(privateKey as unknown as Uint8Array),
            publicKeySpkiDer: Buffer.from(publicKey as unknown as Uint8Array),
        };
    }

    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: curve });

    return {
        privateKey: (privateKey as any).export({ type: 'pkcs8', format: 'der' }) as Buffer,
        publicKeySpkiDer: (publicKey as any).export({ type: 'spki', format: 'der' }) as Buffer,
    };
}

/**
 * Encrypt plaintext using ECDH key agreement and AES-256-GCM
 * @param scheme - Encryption scheme (e.g., 'ecdhx25519_hkdfsha256_aes256gcm')
 * @param localPrivateKey - Local private key for ECDH
 * @param remotePublicKey - Remote public key for ECDH
 * @param plaintext - Data to encrypt
 * @param aad - Optional additional authenticated data
 * @returns Nonce and ciphertext (includes auth tag)
 */
export async function encrypt(
    scheme: string,
    localPrivateKey: KeyObject | Buffer | string,
    remotePublicKey: KeyObject | Buffer | string,
    plaintext: Buffer,
    aad?: Buffer
): Promise<{ nonce: Buffer; ciphertext: Buffer }> {
    const localKey = toKeyObject(localPrivateKey, true);
    const remoteKey = toKeyObject(remotePublicKey, false);
    const key = await deriveKeyAsync(scheme, localKey, remoteKey);

    const nonce = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(getCipher(scheme), key, nonce);
    if (aad) cipher.setAAD(aad as any);

    const encrypted = Buffer.concat([
        cipher.update(plaintext),
        cipher.final(),
        cipher.getAuthTag()
    ]);

    return { nonce: nonce as any, ciphertext: encrypted as any };
}

/**
 * Decrypt ciphertext using ECDH key agreement and AES-256-GCM
 * @param scheme - Encryption scheme (e.g., 'ecdhx25519_hkdfsha256_aes256gcm')
 * @param localPrivateKey - Local private key for ECDH
 * @param remotePublicKey - Remote public key for ECDH
 * @param nonce - Nonce used during encryption
 * @param ciphertext - Encrypted data (includes auth tag at end)
 * @param aad - Optional additional authenticated data
 * @returns Decrypted plaintext
 */
export async function decrypt(
    scheme: string,
    localPrivateKey: KeyObject | Buffer | string,
    remotePublicKey: KeyObject | Buffer | string,
    nonce: Buffer,
    ciphertext: Buffer,
    aad?: Buffer
): Promise<Buffer> {
    if (ciphertext.length < 16) {
        throw new Error('Ciphertext too short (missing auth tag)');
    }

    const localKey = toKeyObject(localPrivateKey, true);
    const remoteKey = toKeyObject(remotePublicKey, false);
    const key = await deriveKeyAsync(scheme, localKey, remoteKey);

    // Last 16 bytes are the auth tag
    const authTag = ciphertext.subarray(ciphertext.length - 16);
    const encryptedData = ciphertext.subarray(0, -16);

    const decipher = crypto.createDecipheriv(getCipher(scheme), key, nonce);
    decipher.setAuthTag(authTag as any);
    if (aad) decipher.setAAD(aad as any);

    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}
