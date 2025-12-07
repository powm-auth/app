/**
 * HKDF (HMAC-based Key Derivation Function) implementation
 * RFC 5869: https://tools.ietf.org/html/rfc5869
 */

import { Buffer } from 'buffer';
import crypto from 'react-native-quick-crypto';

/**
 * HKDF-Extract step
 */
function hkdfExtract(hash: string, salt: Buffer, ikm: Buffer): Buffer {
    const hmac = crypto.createHmac(hash, salt.length > 0 ? salt : Buffer.alloc(hashLength(hash), 0));
    hmac.update(ikm);
    return Buffer.from(hmac.digest());
}

/**
 * HKDF-Expand step
 */
function hkdfExpand(hash: string, prk: Buffer, info: Buffer, length: number): Buffer {
    const hashLen = hashLength(hash);
    const n = Math.ceil(length / hashLen);

    if (n > 255) {
        throw new Error('HKDF: length too long');
    }

    let t = Buffer.alloc(0);
    const blocks: Buffer[] = [];

    for (let i = 1; i <= n; i++) {
        const hmac = crypto.createHmac(hash, prk);
        hmac.update(t);
        hmac.update(info);
        hmac.update(Buffer.from([i]));
        t = Buffer.from(hmac.digest());
        blocks.push(t);
    }

    return Buffer.concat(blocks).slice(0, length);
}

/**
 * Get hash output length in bytes
 */
function hashLength(hash: string): number {
    switch (hash.toLowerCase()) {
        case 'sha256':
        case 'sha-256':
            return 32;
        case 'sha384':
        case 'sha-384':
            return 48;
        case 'sha512':
        case 'sha-512':
            return 64;
        default:
            throw new Error(`Unsupported hash algorithm: ${hash}`);
    }
}

/**
 * HKDF - HMAC-based Key Derivation Function
 * 
 * @param ikm - Input keying material
 * @param length - Length of output keying material in bytes
 * @param salt - Optional salt (default: hash length zeros)
 * @param info - Optional context/application specific info
 * @param hash - Hash algorithm (sha256, sha384, sha512)
 */
export function hkdf(
    ikm: Buffer,
    length: number,
    options: {
        salt?: Buffer;
        info?: Buffer;
        hash: string;
    }
): Buffer {
    const salt = options.salt || Buffer.alloc(0);
    const info = options.info || Buffer.alloc(0);
    const hash = options.hash.toLowerCase().replace(/-/g, '');

    // Extract
    const prk = hkdfExtract(hash, salt, ikm);

    // Expand
    return hkdfExpand(hash, prk, info, length);
}
