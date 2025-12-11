import { hkdf as nobleHkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { sha384, sha512 } from '@noble/hashes/sha512';
import { Buffer } from 'buffer';

const HASHES = {
    sha256,
    sha384,
    sha512,
};

/**
 * HKDF key derivation
 * @param ikm - Input Keying Material
 * @param length - Output length in bytes
 * @param options - Options (salt, info, hash algorithm)
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
    const hashName = options.hash.toLowerCase().replace(/-/g, '') as keyof typeof HASHES;
    const hashFn = HASHES[hashName];

    if (!hashFn) {
        throw new Error(`Unsupported hash algorithm: ${options.hash}`);
    }

    const salt = options.salt ? new Uint8Array(options.salt) : undefined;
    const info = options.info ? new Uint8Array(options.info) : undefined;
    const ikmUint = new Uint8Array(ikm);

    const result = nobleHkdf(hashFn, ikmUint, salt, info, length);
    return Buffer.from(result);
}
