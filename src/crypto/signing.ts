import { ed25519 } from '@noble/curves/ed25519';
import { p256, p384 } from '@noble/curves/nist';
import { sha256, sha384, sha512 } from '@noble/hashes/sha2';
import { Buffer } from 'buffer';
import { encodePkcs8, encodeSpki, generateRawKeyPair, normalizeScheme, parsePkcs8, parseSpki } from './common';

export type SignatureScheme =
    | 'eddsaed25519'
    | 'ecdsap256_sha256'
    | 'ecdsap256_sha384'
    | 'ecdsap384_sha384'
    | 'ecdsap384_sha512';

const HASH_MAP: Record<string, 'sha256' | 'sha384' | 'sha512' | null> = {
    eddsaed25519: null,
    ecdsap256_sha256: 'sha256',
    ecdsap256_sha384: 'sha384',
    ecdsap384_sha384: 'sha384',
    ecdsap384_sha512: 'sha512',
};

const CURVE_MAP: Record<string, 'ed25519' | 'P-256' | 'P-384'> = {
    eddsaed25519: 'ed25519',
    ecdsap256_sha256: 'P-256',
    ecdsap256_sha384: 'P-256',
    ecdsap384_sha384: 'P-384',
    ecdsap384_sha512: 'P-384',
};

function getHashAlgo(scheme: string): 'sha256' | 'sha384' | 'sha512' | null {
    const normalized = normalizeScheme(scheme);
    if (!(normalized in HASH_MAP)) throw new Error(`Unsupported signing scheme: ${scheme}`);
    return HASH_MAP[normalized];
}

function getCurve(scheme: string): 'ed25519' | 'P-256' | 'P-384' {
    const normalized = normalizeScheme(scheme);
    if (!(normalized in CURVE_MAP)) throw new Error(`Unsupported signing scheme: ${scheme}`);
    return CURVE_MAP[normalized];
}

function getHashFunction(hashAlgo: 'sha256' | 'sha384' | 'sha512' | null): (data: Uint8Array) => Uint8Array {
    switch (hashAlgo) {
        case 'sha256':
            return sha256;
        case 'sha384':
            return sha384;
        case 'sha512':
            return sha512;
        default:
            throw new Error(`Invalid hash algorithm: ${hashAlgo}`);
    }
}

export function isSchemeSupported(scheme: string): boolean {
    return normalizeScheme(scheme) in HASH_MAP;
}

/**
 * Generate a key pair for signing
 * @param scheme - Signature scheme (e.g., 'ecdsap256_sha256', 'eddsaed25519')
 * @returns Private key (PKCS8 DER) and public key (SPKI DER) as Buffers
 */
export function generateKeyPair(scheme: string): { privateKeyPkcs8Der: Buffer; publicKeySpkiDer: Buffer } {
    const curve = getCurve(scheme);
    const { privateKey, publicKey } = generateRawKeyPair(curve);

    return {
        privateKeyPkcs8Der: encodePkcs8(privateKey, publicKey, curve),
        publicKeySpkiDer: encodeSpki(publicKey, curve),
    };
}

/**
 * Sign data with private key
 * @param scheme - Signature scheme (e.g., 'ecdsap256_sha256', 'eddsaed25519')
 * @param privateKey - Private key for signing (PKCS8 DER Buffer)
 * @param data - Data to sign
 * @returns Digital signature
 */
export function sign(scheme: string, privateKey: Buffer | string, data: Buffer): Buffer {
    const curve = getCurve(scheme);
    const hashAlgo = getHashAlgo(scheme);

    // Parse private key
    const pkcs8Der = typeof privateKey === 'string' ? Buffer.from(privateKey, 'base64') : privateKey;
    const privateKeyBytes = parsePkcs8(pkcs8Der, curve);

    if (curve === 'ed25519') {
        // Ed25519 signs the message directly without pre-hashing
        const signature = ed25519.sign(data, privateKeyBytes);
        return Buffer.from(signature);
    } else {
        // ECDSA
        const hashFn = getHashFunction(hashAlgo);
        const digest = hashFn(data);

        if (curve === 'P-256') {
            const signature = p256.sign(digest, privateKeyBytes);
            return Buffer.from(signature.toBytes('der'));
        } else {
            const signature = p384.sign(digest, privateKeyBytes);
            return Buffer.from(signature.toBytes('der'));
        }
    }
}

/**
 * Verify signature with public key
 * @param scheme - Signature scheme (e.g., 'ecdsap256_sha256', 'eddsaed25519')
 * @param publicKey - Public key for verification (SPKI DER Buffer)
 * @param data - Original data that was signed
 * @param signature - Signature to verify
 * @returns True if signature is valid, false otherwise
 */
export function verify(scheme: string, publicKey: Buffer | string, data: Buffer, signature: Buffer): boolean {
    try {
        const curve = getCurve(scheme);
        const hashAlgo = getHashAlgo(scheme);

        // Parse public key
        const spkiDer = typeof publicKey === 'string' ? Buffer.from(publicKey, 'base64') : publicKey;
        const publicKeyBytes = parseSpki(spkiDer, curve);

        if (curve === 'ed25519') {
            // Ed25519 verifies the message directly without pre-hashing
            return ed25519.verify(signature, data, publicKeyBytes);
        } else {
            // ECDSA requires hashing first
            const hashFn = getHashFunction(hashAlgo);
            const digest = hashFn(data);

            if (curve === 'P-256') {
                return p256.verify(signature, digest, publicKeyBytes);
            } else {
                return p384.verify(signature, digest, publicKeyBytes);
            }
        }
    } catch {
        return false;
    }
}
