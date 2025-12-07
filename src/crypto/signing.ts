import crypto, { KeyObject } from 'react-native-quick-crypto';
import { normalizeScheme, toKeyObject } from './common';

export type SignatureScheme =
    | 'eddsaed25519'
    | 'ecdsap256_sha256'
    | 'ecdsap256_sha384'
    | 'ecdsap384_sha384'
    | 'ecdsap384_sha512';

const HASH_MAP: Record<string, string | null> = {
    eddsaed25519: null,
    ecdsap256_sha256: 'sha256',
    ecdsap256_sha384: 'sha384',
    ecdsap384_sha384: 'sha384',
    ecdsap384_sha512: 'sha512',
};

function getHashAlgo(scheme: string): string | null {
    const normalized = normalizeScheme(scheme);
    if (!(normalized in HASH_MAP)) throw new Error(`Unsupported signing scheme: ${scheme}`);
    return HASH_MAP[normalized];
}

export function isSchemeSupported(scheme: string): boolean {
    return normalizeScheme(scheme) in HASH_MAP;
}

export function sign(scheme: string, privateKey: KeyObject | Buffer | string, data: Buffer): Buffer {
    const keyObj = toKeyObject(privateKey, true);
    const hashAlgo = getHashAlgo(scheme);

    // Create Sign object
    const signer = crypto.createSign(hashAlgo || 'sha256');
    signer.update(data);
    const signature = signer.sign(keyObj) as any;
    return signature;
}

export function verify(scheme: string, publicKey: KeyObject | Buffer | string, data: Buffer, signature: Buffer): boolean {
    const keyObj = toKeyObject(publicKey, false);
    const hashAlgo = getHashAlgo(scheme);

    // Create Verify object
    const verifier = crypto.createVerify(hashAlgo || 'sha256');
    verifier.update(data);
    const isValid = verifier.verify(keyObj, signature) as any;
    return isValid;
}
