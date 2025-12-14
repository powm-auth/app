import { Wallet } from '@/types/powm';
import { signing } from '@powm/sdk-js/crypto';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';

const { generateKeyPair: generateSigningKeyPair } = signing;

/**
 * Generate a random wallet ID
 */
function generateWalletId(): string {
    const bytes = Crypto.getRandomBytes(24);
    const base32 = Buffer.from(bytes).toString('base64')
        .replace(/\+/g, '')
        .replace(/\//g, '')
        .replace(/=/g, '')
        .toLowerCase()
        .slice(0, 38);
    return `wlt_${base32}`;
}

/**
 * Generate a random salt for attribute hashing
 */
function generateSalt(): string {
    return Buffer.from(Crypto.getRandomBytes(16)).toString('base64');
}



/**
 * Map UI algorithm names to crypto scheme names
 */
function mapAlgorithmToScheme(algorithm: string): string {
    const mapping: Record<string, string> = {
        'EcdsaP256_Sha256': 'ecdsap256_sha256',
        'EcdsaP384_Sha384': 'ecdsap384_sha384',
        'Ed25519': 'eddsaed25519',
    };
    return mapping[algorithm] || 'ecdsap256_sha256';
}

/**
 * Create a new wallet with identity attributes
 * @param attributes - Map of attribute names to values
 * @param signingAlgorithm - The signing algorithm to use (default: EcdsaP256_Sha256)
 * @returns A new Wallet instance with native types (Buffer, Date) and the signing key
 */
export function createWallet(
    attributes: Record<string, string>,
    signingAlgorithm: string = 'EcdsaP256_Sha256'
): { wallet: Wallet; signingPrivateKey: Buffer; publicKeySpkiDer: Buffer } {
    const walletId = generateWalletId();
    const scheme = mapAlgorithmToScheme(signingAlgorithm);
    const { privateKeyPkcs8Der, publicKeySpkiDer } = generateSigningKeyPair(scheme);
    const now = new Date();

    // Convert attributes to wallet attribute format with salts
    const walletAttributes: Record<string, { value: string; salt: string }> = {};
    for (const [key, value] of Object.entries(attributes)) {
        if (value.trim() !== '') {
            walletAttributes[key] = {
                value: value.trim(),
                salt: generateSalt(),
            };
        }
    }

    const wallet: Wallet = {
        id: walletId,
        created_at: now,
        updated_at: null,
        public_key: publicKeySpkiDer,
        signing_algorithm: signingAlgorithm,
        identity_attribute_hashing_scheme: 'hmacsha512', // Placeholder, will be replaced by server value
        anonymizing_hashing_scheme: 'hmacsha512', // Placeholder, will be replaced by server value
        attributes: walletAttributes,
    };

    return { wallet, signingPrivateKey: privateKeyPkcs8Der, publicKeySpkiDer };
}

/**
 * Create a new wallet with identity attributes from server onboarding response
 * @param walletId - Server-assigned wallet ID
 * @param attributes - Identity attributes with values and salts from server
 * @param hashingScheme - Identity attribute hashing scheme from server
 * @param anonymizingHashingScheme - Anonymizing hashing scheme from server
 * @param signingAlgorithm - The signing algorithm to use
 * @param signingPrivateKey - Signing private key buffer
 * @param publicKey - Public key buffer
 * @returns A new Wallet instance with native types (Buffer, Date) and the signing key separately
 */
export function createWalletFromOnboarding(
    walletId: string,
    attributes: Record<string, { value: string; salt: string }>,
    hashingScheme: string,
    anonymizingHashingScheme: string,
    signingAlgorithm: string,
    signingPrivateKey: Buffer,
    publicKey: Buffer
): { wallet: Wallet; signingPrivateKey: Buffer } {
    const now = new Date();

    const wallet: Wallet = {
        id: walletId,
        created_at: now,
        updated_at: null,
        public_key: publicKey,
        signing_algorithm: signingAlgorithm,
        identity_attribute_hashing_scheme: hashingScheme,
        anonymizing_hashing_scheme: anonymizingHashingScheme,
        attributes,
    };

    return { wallet, signingPrivateKey };
}