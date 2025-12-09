import crypto, { KeyObject } from 'react-native-quick-crypto';

/**
 * Normalize cryptographic scheme names to lowercase with underscores
 * @param s - Scheme name (e.g., 'EcdsaP256_Sha256' or 'HMAC-SHA512')
 * @returns Normalized scheme (e.g., 'ecdsap256_sha256' or 'hmac_sha512')
 */
export function normalizeScheme(s: string): string {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Convert various key formats to KeyObject
 * @param input - Key in PEM string, DER buffer, or KeyObject format
 * @param isPrivate - Whether this is a private key (true) or public key (false)
 * @returns KeyObject ready for crypto operations
 */
export function toKeyObject(input: KeyObject | Buffer | string, isPrivate: boolean): KeyObject {
    if (input instanceof KeyObject) return input;

    const isPem = typeof input === 'string' && input.includes('-----BEGIN');
    const format = isPem ? 'pem' : 'der';
    const type = isPrivate ? 'pkcs8' : 'spki';

    const opts = { key: input, format, type } as any;
    return isPrivate ? crypto.createPrivateKey(opts) : crypto.createPublicKey(opts);
}