import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { Buffer } from 'buffer';
import { normalizeScheme } from './common';

export type KeyedHashingScheme = 'hmacsha256' | 'hmacsha512';

const HASH_SIZE_MAP: Record<string, number> = {
    hmacsha256: 32,
    hmacsha512: 64,
};

const HASH_ALGO_MAP = {
    hmacsha256: sha256,
    hmacsha512: sha512,
};

function getHashAlgo(scheme: string) {
    const normalized = normalizeScheme(scheme);
    if (!(normalized in HASH_ALGO_MAP)) throw new Error(`Unsupported keyed hashing scheme: ${scheme}`);
    return HASH_ALGO_MAP[normalized as keyof typeof HASH_ALGO_MAP];
}

export function isSchemeSupported(scheme: string): boolean {
    return normalizeScheme(scheme) in HASH_ALGO_MAP;
}

export function validate(scheme: string, hash: Buffer): boolean {
    const normalized = normalizeScheme(scheme);
    const expectedSize = HASH_SIZE_MAP[normalized];
    return expectedSize !== undefined && hash.length === expectedSize;
}

/**
 * Compute HMAC hash of input data
 * @param scheme - Hashing scheme (e.g., 'hmacsha256', 'hmacsha512')
 * @param key - Secret key for HMAC
 * @param input - Data to hash
 * @returns HMAC digest
 */
export function hash(scheme: string, key: Buffer, input: Buffer): Buffer {
    const hashFn = getHashAlgo(scheme);
    const result = hmac(hashFn, key, input);
    return Buffer.from(result);
}
