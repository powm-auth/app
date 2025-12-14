/**
 * Wallet Service
 * Handles wallet operations and challenge processing
 */

import { acceptIdentityChallenge, claimIdentityChallenge, rejectIdentityChallenge } from '@/services/powm-api';
import { loadWallet, withAnonymizingKey, withSigningKey } from '@/services/wallet-storage';
import type { ClaimChallengeResponse, Wallet } from '@/types/powm';
import { createIdentityChallenge, decryptAndVerifyIdentity, decryptIdentityChallengeResponse, verifyIdentityChallengeSignature, waitForCompletedIdentityChallenge } from '@powm/sdk-js';
import { encrypting, keyedHashing, signing } from '@powm/sdk-js/crypto';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';

const { encrypt, generateKeyPair } = encrypting;
const { sign } = signing;
const { hash } = keyedHashing;

// Current wallet instance cache
let currentWallet: Wallet | null = null;

/**
 * Load and cache the current wallet
 * @param forceReload - If true, reload from storage even if cached
 */
export async function loadCurrentWallet(forceReload: boolean = false): Promise<Wallet | null> {
    if (!currentWallet || forceReload) {
        currentWallet = await loadWallet();
    }
    return currentWallet;
}

/**
 * Get the cached current wallet
 */
export function getCurrentWallet(): Wallet | null {
    return currentWallet;
}

/**
 * Parse challenge ID from scanned data
 * Supports both raw challenge IDs and powm:// protocol URLs
 */
export function parseChallengeId(scannedData: string): string {
    const trimmed = scannedData.trim();

    // Check for powm:// protocol
    if (trimmed.startsWith('powm://')) {
        // Extract challenge ID from URL
        // Format could be: powm://challenge/{id} or powm://{id}
        const match = trimmed.match(/powm:\/\/(?:challenge\/)?([a-z0-9_]+)/i);
        if (match && match[1]) {
            return match[1];
        }
    }

    // Return as-is if it looks like a challenge ID (alphanumeric + underscores)
    if (/^[a-z0-9_]+$/i.test(trimmed)) {
        return trimmed;
    }

    throw new Error('Invalid challenge ID format');
}

/**
 * Claim an identity challenge
 * Signs and submits claim request to Powm server
 */
export async function claimChallenge(
    challengeId: string,
    wallet: Wallet
): Promise<ClaimChallengeResponse> {
    // Generate nonce (32 chars, URL-safe base64)
    const randomBytes = Crypto.getRandomBytes(32);
    const nonce = btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 32);

    // Get current time in UTC ISO format
    const time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    // Build signing string: {time}|{nonce}|{challenge_id}|{wallet_id}|
    const signingString = `${time}|${nonce}|${challengeId}|${wallet.id}|`;

    // Sign the string using wallet's signing key (retrieved only for signing)
    const walletSignature = await withSigningKey((privateKey) => {
        const dataBytes = Buffer.from(signingString, 'utf-8');
        const signature = sign(
            wallet.signing_algorithm,
            privateKey,
            dataBytes as any
        );
        return Buffer.from(signature).toString('base64');
    });

    // Submit claim to Powm server
    const claimResponse = await claimIdentityChallenge({
        time,
        nonce,
        challenge_id: challengeId,
        wallet_id: wallet.id,
        wallet_signature: walletSignature,
    });

    // Verify the challenge Powm signature
    if (!verifyIdentityChallengeSignature(claimResponse.challenge)) {
        throw new Error('Invalid challenge signature from server');
    }

    return claimResponse;
}

/**
 * Handle anonymous_id attribute that is computed on-the-fly rather than stored in wallet
 * Returns the computed value and salt, or null if not the anonymous_id attribute
 */
async function handleAnonymousIdAttribute(
    attrName: string,
    wallet: Wallet,
    requesterId: string
): Promise<{ value: string; salt: string } | null> {
    if (attrName === 'anonymous_id') {
        // Compute anonymous_id using KeyedHashing(anonymizing_scheme, anonymizing_key, requester_id)
        const anonymousId = await withAnonymizingKey((anonymizingKey) => {
            const requesterIdBytes = new TextEncoder().encode(requesterId);
            const anonymousIdHash = hash(
                wallet.anonymizing_hashing_scheme,
                anonymizingKey,
                requesterIdBytes as any
            );
            return Buffer.from(anonymousIdHash).toString('base64');
        });

        // Generate random salt - it's sent with the accept request anyway
        const saltBytes = Crypto.getRandomBytes(32);
        const salt = btoa(String.fromCharCode(...saltBytes));

        return { value: anonymousId, salt };
    }

    // Not a special attribute
    return null;
}

/**
 * Accept an identity challenge
 * Encrypts identity attributes and submits acceptance to Powm server
 */
export async function acceptChallenge(
    challengeId: string,
    wallet: Wallet,
    claimResponse: ClaimChallengeResponse
): Promise<void> {
    // Build attribute payload and compute hashes using challenge's pre-sorted order
    const attributePayload: Record<string, string> = {};
    const orderedHashes: Uint8Array[] = [];
    const requestedSalts: Record<string, string> = {};

    const hashingScheme = wallet.identity_attribute_hashing_scheme;
    const requestedAttrs = claimResponse.challenge.identity_attributes;
    const requesterId = claimResponse.claim.requester_id;
    let includeAnonymizingKey = false;

    // CRITICAL: Use challenge.identity_attributes array order (already sorted by server)
    // DO NOT sort again - this is the canonical order
    for (const attrName of requestedAttrs) {
        let value: string;
        let salt: string;

        // Check for anonymous_id attribute first
        const anonIdAttr = await handleAnonymousIdAttribute(attrName, wallet, requesterId);
        if (anonIdAttr) {
            value = anonIdAttr.value;
            salt = anonIdAttr.salt;
            includeAnonymizingKey = true;
            console.log('value', value);
        } else if (attrName in wallet.attributes) {
            value = wallet.attributes[attrName].value;
            salt = wallet.attributes[attrName].salt;
        } else {
            // Wallet doesn't have this attribute - set to null and skip hash computation
            attributePayload[attrName] = null as any;
            continue;
        }

        // Add to payload and salts
        attributePayload[attrName] = value;
        requestedSalts[attrName] = salt;

        // Compute hash
        const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
        const valueBytes = new TextEncoder().encode(value);
        const attrHash = hash(hashingScheme, saltBytes as any, valueBytes as any);
        orderedHashes.push(attrHash as any);
    }

    // Concatenate hashes in the order they were computed (challenge's canonical order)
    const totalLength = orderedHashes.reduce((acc, h) => acc + h.length, 0);
    const combinedHashes = new Uint8Array(totalLength);

    let offset = 0;
    for (const attrHash of orderedHashes) {
        combinedHashes.set(attrHash, offset);
        offset += attrHash.length;
    }

    const challengeIdBytes = new TextEncoder().encode(challengeId);
    const identityHash = hash(hashingScheme, challengeIdBytes as any, combinedHashes as any);
    const identityHashB64 = btoa(String.fromCharCode(...(identityHash as any)));

    // Encrypt the attribute payload
    const payloadJson = JSON.stringify({ attributes: attributePayload });
    const payloadBytes = new TextEncoder().encode(payloadJson);

    const encryptingScheme = claimResponse.challenge.encrypting_scheme;
    const appPublicKeyB64 = claimResponse.claim.encrypting_requester_key;

    // Decode base64 to Buffer (not Uint8Array)
    const appPublicKeyBytes = Uint8Array.from(atob(appPublicKeyB64), c => c.charCodeAt(0));
    const appPublicKeyDer = Buffer.from(appPublicKeyBytes);

    // Generate ephemeral key pair for encryption
    const ephemeralKeys = generateKeyPair(encryptingScheme);

    // Encrypt using SDK (ephemeralKeys.privateKeyPkcs8Der is already a Buffer)
    const { nonce, ciphertext } = await encrypt(
        encryptingScheme,
        ephemeralKeys.privateKeyPkcs8Der,
        appPublicKeyDer,
        Buffer.from(payloadBytes),
        undefined
    );

    // Convert to base64
    const walletKeyB64 = Buffer.from(ephemeralKeys.publicKeySpkiDer).toString('base64');
    const nonceB64 = Buffer.from(nonce).toString('base64');
    const ciphertextB64 = Buffer.from(ciphertext).toString('base64');

    // Generate nonce and timestamp for signing
    const randomBytes = Crypto.getRandomBytes(32);
    const requestNonce = btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 32);

    const time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    // Build salts string: sorted alphabetically by key for signing
    const sortedSaltKeys = Object.keys(requestedSalts).sort();
    const saltsString = sortedSaltKeys
        .map(key => `${key}:${requestedSalts[key]}`)
        .join(',');

    // Get anonymizing key if needed
    const anonymizingKeyB64 = includeAnonymizingKey
        ? await withAnonymizingKey((key) => key.toString('base64'))
        : undefined;

    // Build signing string for accept (NEW FORMAT with salts)
    // Format: time|nonce|challenge_id|wallet_id|identity_hash|salts_string|wallet_key|nonce|encrypted|anonymizing_key|
    const signingString = `${time}|${requestNonce}|${challengeId}|${wallet.id}|${identityHashB64}|${saltsString}|${walletKeyB64}|${nonceB64}|${ciphertextB64}|${anonymizingKeyB64 || ''}|`;

    // Sign the string using wallet's signing key (retrieved only for signing)
    const signatureB64 = await withSigningKey((privateKey) => {
        const sigBytes = new TextEncoder().encode(signingString);
        const signature = sign(wallet.signing_algorithm, privateKey, sigBytes as any);
        return Buffer.from(signature).toString('base64');
    });

    // Submit acceptance with salts included
    await acceptIdentityChallenge({
        time,
        nonce: requestNonce,
        challenge_id: challengeId,
        wallet_id: wallet.id,
        identity_hash: identityHashB64,
        identity_attribute_hashing_salts: requestedSalts,
        identity_encrypting_wallet_key: walletKeyB64,
        identity_encrypting_nonce: nonceB64,
        identity_encrypted: ciphertextB64,
        anonymizing_key: anonymizingKeyB64,
        wallet_signature: signatureB64,
    });
}

/**
 * Reject an identity challenge
 * Computes identity hash for zero-knowledge proof and submits rejection to Powm server
 */
export async function rejectChallenge(
    challengeId: string,
    wallet: Wallet,
    claimResponse: ClaimChallengeResponse
): Promise<void> {
    // Generate nonce and timestamp for signing
    const randomBytes = Crypto.getRandomBytes(32);
    const requestNonce = btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 32);

    const time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    // Build signing string for reject: {time}|{nonce}|{challenge_id}|{wallet_id}|
    const signingString = `${time}|${requestNonce}|${challengeId}|${wallet.id}|`;

    // Sign the string using wallet's signing key (retrieved only for signing)
    const signatureB64 = await withSigningKey((privateKey) => {
        const sigBytes = new TextEncoder().encode(signingString);
        const signature = sign(wallet.signing_algorithm, privateKey, sigBytes as any);
        return Buffer.from(signature).toString('base64');
    });

    // Submit rejection
    await rejectIdentityChallenge({
        time,
        nonce: requestNonce,
        challenge_id: challengeId,
        wallet_id: wallet.id,
        wallet_signature: signatureB64,
    });
}

/**
 * Create a wallet-to-wallet identity challenge
 */
export async function createWalletChallenge(
    wallet: Wallet,
    attributes: string[]
): Promise<{ challengeId: string; privateKey: Buffer; challenge: any }> {
    const encryptingScheme = 'ecdhp256_hkdfsha256_aes256gcm';
    const ephemeralKeys = generateKeyPair(encryptingScheme);
    const publicKeyB64 = Buffer.from(ephemeralKeys.publicKeySpkiDer).toString('base64');

    // Use withSigningKey to sign the challenge
    const challenge = await withSigningKey(async (privateKey) => {
        const signingPrivateKeyB64 = privateKey.toString('base64');
        return await createIdentityChallenge(
            wallet.id,
            attributes,
            encryptingScheme,
            publicKeyB64,
            wallet.signing_algorithm,
            signingPrivateKeyB64
        );
    });

    return {
        challengeId: challenge.challenge_id,
        privateKey: Buffer.from(ephemeralKeys.privateKeyPkcs8Der),
        challenge: challenge
    };
}

/**
 * Poll for challenge completion and decrypt identity
 * Polls with a long timeout to allow for challenge completion
 */
export async function pollChallenge(
    challengeId: string,
    privateKey: Buffer,
    onStatus?: (status: string) => void
): Promise<any> {
    try {
        // Wait for challenge to be complete
        const completedChallenge = await waitForCompletedIdentityChallenge(
            challengeId
        );

        // Decrypt the challenge response
        const response = decryptIdentityChallengeResponse(
            completedChallenge,
            privateKey.toString('base64')
        );

        if (onStatus) onStatus(response.status);

        if (response.status === 'accepted') {
            const acceptance = response.data as any;
            const identity = await decryptAndVerifyIdentity(
                completedChallenge,
                acceptance,
                privateKey.toString('base64')
            );
            return identity;
        } else if (response.status === 'rejected') {
            throw new Error('Challenge was rejected');
        }
    } catch (e: any) {
        console.error('Poll challenge error:', e);
        throw e;
    }
}
