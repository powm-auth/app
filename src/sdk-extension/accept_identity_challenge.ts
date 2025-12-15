import { encrypting, keyedHashing } from '@powm/sdk-js/crypto';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { Signer } from './claim_identity_challenge';
import { POWM_API_BASE } from './constants';
import { AcceptChallengeRequest, AcceptIdentityChallengeError, ClaimChallengeResponse, Wallet } from './structs';

const { encrypt, generateKeyPair } = encrypting;
const { hash } = keyedHashing;

export type Anonymizer = (data: Uint8Array) => Promise<Uint8Array>;

/**
 * Handle anonymous_id attribute that is computed on-the-fly rather than stored in wallet
 * Returns the computed value and salt, or null if not the anonymous_id attribute
 */
async function handleAnonymousIdAttribute(
    attrName: string,
    wallet: Wallet,
    requesterId: string,
    anonymizer: Anonymizer
): Promise<{ value: string; salt: string } | null> {
    if (attrName === 'anonymous_id') {
        // Compute anonymous_id using KeyedHashing(anonymizing_scheme, anonymizing_key, requester_id)
        const requesterIdBytes = new TextEncoder().encode(requesterId);
        const anonymousIdHash = await anonymizer(requesterIdBytes);
        const anonymousId = Buffer.from(anonymousIdHash).toString('base64');

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
export async function acceptIdentityChallenge(
    challengeId: string,
    wallet: Wallet,
    claimResponse: ClaimChallengeResponse,
    signer: Signer,
    anonymizer: Anonymizer,
    getAnonymizingKey: () => Promise<string> // Need raw key for sending to server if needed?
    // Wait, acceptChallengeRequest has `anonymizing_key?: string`.
    // In wallet-service.ts, it sets `anonymizing_key` if `includeAnonymizingKey` is true.
    // And it gets it via `withAnonymizingKey`.
    // So I need a way to get the anonymizing key itself.
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
        const anonIdAttr = await handleAnonymousIdAttribute(attrName, wallet, requesterId, anonymizer);
        if (anonIdAttr) {
            value = anonIdAttr.value;
            salt = anonIdAttr.salt;
            includeAnonymizingKey = true;
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

    // Encrypt payload
    const encrypted = await encrypt(
        encryptingScheme,
        ephemeralKeys.privateKeyPkcs8Der,
        appPublicKeyDer,
        Buffer.from(payloadBytes),
        undefined
    );

    // Prepare request
    const time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const nonce = btoa(String.fromCharCode(...Crypto.getRandomBytes(32)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 32);

    // Get anonymizing key if needed
    let anonymizingKeyB64: string | undefined;
    if (includeAnonymizingKey) {
        anonymizingKeyB64 = await getAnonymizingKey();
    }

    // Build salts string: sorted alphabetically by key for signing
    const sortedSaltKeys = Object.keys(requestedSalts).sort();
    const saltsString = sortedSaltKeys
        .map(key => `${key}:${requestedSalts[key]}`)
        .join(',');

    // Build signing string
    // Format: time|nonce|challenge_id|wallet_id|identity_hash|salts_string|wallet_key|nonce|encrypted|anonymizing_key|
    const ephemeralPublicKeyB64 = Buffer.from(ephemeralKeys.publicKeySpkiDer).toString('base64');
    const encryptedNonceB64 = Buffer.from(encrypted.nonce).toString('base64');
    const encryptedCiphertextB64 = Buffer.from(encrypted.ciphertext).toString('base64');

    const signingString = `${time}|${nonce}|${challengeId}|${wallet.id}|${identityHashB64}|${saltsString}|${ephemeralPublicKeyB64}|${encryptedNonceB64}|${encryptedCiphertextB64}|${anonymizingKeyB64 || ''}|`;

    const walletSignature = await signer(Buffer.from(signingString, 'utf-8'));

    const request: AcceptChallengeRequest = {
        time,
        nonce,
        challenge_id: challengeId,
        wallet_id: wallet.id,
        identity_hash: identityHashB64,
        identity_attribute_hashing_salts: requestedSalts,
        identity_encrypting_wallet_key: ephemeralPublicKeyB64,
        identity_encrypting_nonce: encryptedNonceB64,
        identity_encrypted: encryptedCiphertextB64,
        anonymizing_key: anonymizingKeyB64,
        wallet_signature: walletSignature,
    };

    const response = await fetch(
        `${POWM_API_BASE}/identity-challenges/accept`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[PowmAPI] Failed to accept challenge - HTTP ${response.status}: ${errorBody}`);
        throw new AcceptIdentityChallengeError(
            'REQUEST_FAILED',
            `Failed to accept challenge (HTTP ${response.status})`,
            response.status,
            errorBody
        );
    }
}
