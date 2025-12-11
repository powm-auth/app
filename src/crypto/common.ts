import { ed25519, x25519 } from '@noble/curves/ed25519';
import { p256, p384 } from '@noble/curves/nist';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { Asn1Builder, Asn1Parser } from './asn1';

// Polyfill for global.crypto.getRandomValues (required by @noble libraries)
if (typeof global.crypto === 'undefined') {
    (global as any).crypto = {};
}
if (typeof global.crypto.getRandomValues === 'undefined') {
    global.crypto.getRandomValues = Crypto.getRandomValues as any;
}

// OIDs
export const OID_EC_PUBLIC_KEY = [0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01];
export const OID_P256 = [0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07];
export const OID_P384 = [0x2B, 0x81, 0x04, 0x00, 0x22];
export const OID_X25519 = [0x2B, 0x65, 0x6E];
export const OID_ED25519 = [0x2B, 0x65, 0x70];

export type CurveName = 'x25519' | 'ed25519' | 'P-256' | 'P-384';

/**
 * Normalize cryptographic scheme names to lowercase with underscores
 * @param s - Scheme name (e.g., 'EcdsaP256_Sha256' or 'HMAC-SHA512')
 * @returns Normalized scheme (e.g., 'ecdsap256_sha256' or 'hmac_sha512')
 */
export function normalizeScheme(s: string): string {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Helper to strip PEM headers/footers and newlines
function stripPem(pem: string): string {
    return pem
        .replace(/-----BEGIN [^-]+-----/, '')
        .replace(/-----END [^-]+-----/, '')
        .replace(/\s+/g, '');
}

/**
 * Parse key to raw DER Buffer
 * @param input - Key in PEM string, base64 DER string, or DER buffer
 * @returns DER Buffer
 */
export function parseKey(input: Buffer | string): Buffer {
    if (Buffer.isBuffer(input)) return input;
    if (typeof input === 'string') {
        if (input.includes('-----BEGIN')) {
            return Buffer.from(stripPem(input), 'base64');
        }
        return Buffer.from(input, 'base64');
    }
    throw new Error('Unsupported key format: expected Buffer or string');
}

/**
 * Generate raw key pair for a given curve
 */
export function generateRawKeyPair(curve: CurveName): { privateKey: Uint8Array; publicKey: Uint8Array } {
    if (curve === 'x25519') {
        const privateKey = Crypto.getRandomBytes(32);
        const publicKey = x25519.getPublicKey(privateKey);
        return { privateKey, publicKey };
    } else if (curve === 'ed25519') {
        const privateKey = Crypto.getRandomBytes(32);
        const publicKey = ed25519.getPublicKey(privateKey);
        return { privateKey, publicKey };
    } else if (curve === 'P-256') {
        let privateKey: Uint8Array;
        do {
            privateKey = Crypto.getRandomBytes(32);
        } while (!p256.utils.isValidPrivateKey(privateKey));
        const publicKey = p256.getPublicKey(privateKey, false);
        return { privateKey, publicKey };
    } else if (curve === 'P-384') {
        let privateKey: Uint8Array;
        do {
            privateKey = Crypto.getRandomBytes(48);
        } while (!p384.utils.isValidPrivateKey(privateKey));
        const publicKey = p384.getPublicKey(privateKey, false);
        return { privateKey, publicKey };
    }
    throw new Error(`Unsupported curve: ${curve}`);
}

/**
 * Encode private key as PKCS#8 DER format
 */
export function encodePkcs8(privateKey: Uint8Array, publicKey: Uint8Array, curve: CurveName): Buffer {
    if (curve === 'x25519' || curve === 'ed25519') {
        const oid = curve === 'x25519' ? OID_X25519 : OID_ED25519;
        // PKCS#8 for Ed25519/X25519 (RFC 8410)
        return new Asn1Builder()
            .sequence(root => {
                root.integer(0); // Version
                root.sequence(alg => {
                    alg.oid(oid);
                });
                // PrivateKey (wrapped in OCTET STRING)
                root.octetString(
                    new Asn1Builder()
                        .octetString(privateKey)
                        .toBuffer()
                );
            })
            .toBuffer();
    } else {
        // PKCS#8 for ECDSA P-256/P-384 (RFC 5915 + RFC 5208)
        const curveOid = curve === 'P-256' ? OID_P256 : OID_P384;

        // 1. Build ECPrivateKey (RFC 5915)
        const ecPrivateKey = new Asn1Builder()
            .sequence(seq => {
                seq.integer(1); // Version 1
                seq.octetString(privateKey);
                // [0] parameters
                seq.contextSpecific(0, ctx => {
                    ctx.oid(curveOid);
                });
                // [1] publicKey
                seq.contextSpecific(1, ctx => {
                    ctx.bitString(publicKey);
                });
            })
            .toBuffer();

        // 2. Build Outer PKCS#8 (RFC 5208)
        return new Asn1Builder()
            .sequence(root => {
                root.integer(0); // Version 0
                // AlgorithmIdentifier
                root.sequence(alg => {
                    alg.oid(OID_EC_PUBLIC_KEY);
                    alg.oid(curveOid);
                });
                // PrivateKey
                root.octetString(ecPrivateKey);
            })
            .toBuffer();
    }
}

/**
 * Encode public key as SPKI DER format
 */
export function encodeSpki(publicKey: Uint8Array, curve: CurveName): Buffer {
    let oid: number[];
    let paramsOid: number[] | null = null;

    if (curve === 'x25519') oid = OID_X25519;
    else if (curve === 'ed25519') oid = OID_ED25519;
    else {
        oid = OID_EC_PUBLIC_KEY;
        paramsOid = curve === 'P-256' ? OID_P256 : OID_P384;
    }

    return new Asn1Builder()
        .sequence(root => {
            root.sequence(alg => {
                alg.oid(oid);
                if (paramsOid) alg.oid(paramsOid);
            });
            root.bitString(publicKey);
        })
        .toBuffer();
}

/**
 * Parse private key from PKCS8 DER
 */
export function parsePkcs8(pkcs8Der: Buffer, curve: CurveName): Uint8Array {
    const parser = new Asn1Parser(pkcs8Der);

    if (curve === 'x25519' || curve === 'ed25519') {
        // RFC 8410: PrivateKey is an OCTET STRING containing the key
        // Wrapped in another OCTET STRING in PKCS#8
        const wrapper = parser.findOctetStringWithTag(0x04);
        if (wrapper && wrapper.length === 34 && wrapper[0] === 0x04 && wrapper[1] === 0x20) {
            return wrapper.subarray(2, 34);
        }
        // Fallback search
        for (let i = 0; i < pkcs8Der.length - 34; i++) {
            if (pkcs8Der[i] === 0x04 && pkcs8Der[i + 1] === 0x22 &&
                pkcs8Der[i + 2] === 0x04 && pkcs8Der[i + 3] === 0x20) {
                return pkcs8Der.subarray(i + 4, i + 36);
            }
        }
    } else {
        // ECDSA
        const keySize = curve === 'P-256' ? 32 : 48;
        const tag = keySize === 32 ? 0x20 : 0x30;
        for (let i = 0; i < pkcs8Der.length - keySize - 1; i++) {
            if (pkcs8Der[i] === 0x04 && pkcs8Der[i + 1] === tag) {
                return pkcs8Der.subarray(i + 2, i + 2 + keySize);
            }
        }
    }
    throw new Error('Could not parse private key from PKCS#8 DER');
}

/**
 * Parse public key from SPKI DER
 */
export function parseSpki(spkiDer: Buffer, curve: CurveName): Uint8Array {
    const parser = new Asn1Parser(spkiDer);

    if (curve === 'x25519' || curve === 'ed25519') {
        try {
            const root = parser.readSequence();
            root.skip(); // Algorithm
            return root.readBitString();
        } catch (e) {
            return spkiDer.subarray(-32);
        }
    } else {
        try {
            const root = parser.readSequence();
            root.skip(); // Algorithm
            return root.readBitString();
        } catch (e) {
            const publicKeySize = curve === 'P-256' ? 65 : 97;
            return spkiDer.subarray(-publicKeySize);
        }
    }
}
