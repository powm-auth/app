import crypto, { KeyObject } from 'react-native-quick-crypto';

export function normalizeScheme(s: string): string {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export function toKeyObject(input: KeyObject | Buffer | string, isPrivate: boolean): KeyObject {
    if (input instanceof KeyObject) return input;
    const isPem = typeof input === 'string' && input.includes('-----BEGIN');
    const opts = { key: input, format: isPem ? 'pem' : 'der', type: isPrivate ? 'pkcs8' : 'spki' } as any;
    return isPrivate ? crypto.createPrivateKey(opts) : crypto.createPublicKey(opts);
}