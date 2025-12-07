/**
 * Wallet Service
 * Handles wallet operations and challenge processing
 */

import { encrypt, generateKeyPair } from '@/crypto/encrypting';
import { hash } from '@/crypto/keyed_hashing';
import { sign } from '@/crypto/signing';
import { acceptIdentityChallenge, claimIdentityChallenge, rejectIdentityChallenge } from '@/services/powm-api';
import type { ClaimChallengeResponse, Wallet } from '@/types/powm';
import { Buffer } from 'buffer';
import crypto from 'react-native-quick-crypto';

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
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const nonce = btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 32);

    // Get current time in UTC ISO format
    const time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    // Build signing string: {time}|{nonce}|{challenge_id}|{wallet_id}|
    const signingString = `${time}|${nonce}|${challengeId}|${wallet.id}|`;

    // Sign the string using wallet's private key
    // Convert string to Uint8Array for signing
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(signingString);

    const signature = sign(
        wallet.algorithm,
        wallet.private_key,
        dataBytes as any
    );
    const walletSignature = signature.toString('base64');

    // Submit claim to Powm server
    const claimResponse = await claimIdentityChallenge({
        time,
        nonce,
        challenge_id: challengeId,
        wallet_id: wallet.id,
        wallet_signature: walletSignature,
    });

    return claimResponse;
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
    // Build attribute payload
    const attributePayload: Record<string, string> = {};
    const attributeHashes: Record<string, Uint8Array> = {};

    const hashingScheme = claimResponse.claim.identity_attribute_hashing_scheme;
    const salts = claimResponse.claim.identity_attribute_hashing_salts;

    // Compute hashes for each requested attribute
    for (const [attrName, saltB64] of Object.entries(salts)) {
        if (!(attrName in wallet.attributes)) {
            throw new Error(`Attribute '${attrName}' not found in wallet`);
        }

        const attrValue = wallet.attributes[attrName];
        attributePayload[attrName] = attrValue;

        // Decode salt and compute hash
        const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(attrValue);

        const attrHash = hash(hashingScheme, salt as any, dataBytes as any);
        attributeHashes[attrName] = attrHash as any;
    }

    // Compute identity hash (HMAC of concatenated attribute hashes using challenge_id as key)
    const sortedAttrNames = Object.keys(attributeHashes).sort();
    const combinedHashes = new Uint8Array(
        sortedAttrNames.reduce((acc, name) => acc + attributeHashes[name].length, 0)
    );

    let offset = 0;
    for (const name of sortedAttrNames) {
        combinedHashes.set(attributeHashes[name], offset);
        offset += attributeHashes[name].length;
    }

    const challengeIdBytes = new TextEncoder().encode(challengeId);
    const identityHash = hash(hashingScheme, challengeIdBytes as any, combinedHashes as any);
    const identityHashB64 = btoa(String.fromCharCode(...(identityHash as any)));

    // Encrypt the attribute payload
    const payloadJson = JSON.stringify({ attributes: attributePayload });
    const payloadBytes = new TextEncoder().encode(payloadJson);

    const encryptingScheme = claimResponse.challenge.encrypting_scheme;
    const appPublicKeyB64 = claimResponse.claim.encrypting_application_key;

    // Decode base64 to Buffer (not Uint8Array)
    const appPublicKeyBytes = Uint8Array.from(atob(appPublicKeyB64), c => c.charCodeAt(0));
    const appPublicKeyDer = Buffer.from(appPublicKeyBytes);

    // Generate ephemeral key pair for encryption
    const ephemeralKeys = generateKeyPair(encryptingScheme);

    // Encrypt using SDK (ephemeralKeys.privateKey is already a Buffer)
    const { nonce, ciphertext } = await encrypt(
        encryptingScheme,
        ephemeralKeys.privateKey,
        appPublicKeyDer,
        Buffer.from(payloadBytes),
        undefined
    );

    // Convert to base64
    const walletKeyB64 = btoa(String.fromCharCode(...ephemeralKeys.publicKeySpkiDer));
    const nonceB64 = btoa(String.fromCharCode(...(nonce as any)));
    const ciphertextB64 = btoa(String.fromCharCode(...(ciphertext as any)));

    // Generate nonce and timestamp for signing
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const requestNonce = btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 32);

    const time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    // Build signing string for accept
    const signingString = `${time}|${requestNonce}|${challengeId}|${wallet.id}|${identityHashB64}|${walletKeyB64}|${nonceB64}|${ciphertextB64}|`;

    // Sign the string
    const sigBytes = new TextEncoder().encode(signingString);
    const signature = sign(wallet.algorithm, wallet.private_key, sigBytes as any);
    const signatureB64 = signature.toString('base64');

    // Submit acceptance
    await acceptIdentityChallenge({
        time,
        nonce: requestNonce,
        challenge_id: challengeId,
        wallet_id: wallet.id,
        identity_hash: identityHashB64,
        identity_encrypting_wallet_key: walletKeyB64,
        identity_encrypting_nonce: nonceB64,
        identity_encrypted: ciphertextB64,
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
    // Compute attribute hashes (same as accept flow, for zero-knowledge proof)
    const attributeHashes: Record<string, Uint8Array> = {};

    const hashingScheme = claimResponse.claim.identity_attribute_hashing_scheme;
    const salts = claimResponse.claim.identity_attribute_hashing_salts;

    for (const [attrName, saltB64] of Object.entries(salts)) {
        const attrValue = wallet.attributes[attrName];
        if (!attrValue) {
            continue; // Skip attributes wallet doesn't have
        }

        // Decode salt and compute hash
        const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(attrValue);

        const attrHash = hash(hashingScheme, salt as any, dataBytes as any);
        attributeHashes[attrName] = attrHash as any;
    }

    // Compute identity hash (HMAC of concatenated attribute hashes using challenge_id as key)
    const sortedAttrNames = Object.keys(attributeHashes).sort();
    const combinedHashes = new Uint8Array(
        sortedAttrNames.reduce((acc, name) => acc + attributeHashes[name].length, 0)
    );

    let offset = 0;
    for (const name of sortedAttrNames) {
        combinedHashes.set(attributeHashes[name], offset);
        offset += attributeHashes[name].length;
    }

    const challengeIdBytes = new TextEncoder().encode(challengeId);
    const identityHash = hash(hashingScheme, challengeIdBytes as any, combinedHashes as any);
    const identityHashB64 = btoa(String.fromCharCode(...(identityHash as any)));

    // Generate nonce and timestamp for signing
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const requestNonce = btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 32);

    const time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    // Build signing string for reject: {time}|{nonce}|{challenge_id}|{wallet_id}|{identity_hash}|
    const signingString = `${time}|${requestNonce}|${challengeId}|${wallet.id}|${identityHashB64}|`;

    // Sign the string
    const sigBytes = new TextEncoder().encode(signingString);
    const signature = sign(wallet.algorithm, wallet.private_key, sigBytes as any);
    const signatureB64 = signature.toString('base64');

    // Submit rejection
    await rejectIdentityChallenge({
        time,
        nonce: requestNonce,
        challenge_id: challengeId,
        wallet_id: wallet.id,
        identity_hash: identityHashB64,
        wallet_signature: signatureB64,
    });
}
