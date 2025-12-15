import { verifyIdentityChallengeSignature } from '@powm/sdk-js';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { POWM_API_BASE } from './constants';
import { ClaimChallengeRequest, ClaimChallengeResponse, ClaimIdentityChallengeError } from './structs';
import { fetchWithTimeout } from './utils';

export type Signer = (data: Uint8Array) => Promise<string>;

/**
 * Claim an identity challenge
 * Signs and submits claim request to Powm server
 */
export async function claimIdentityChallenge(
    challengeId: string,
    walletId: string,
    signer: Signer
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
    const signingString = `${time}|${nonce}|${challengeId}|${walletId}|`;

    // Sign the string
    const walletSignature = await signer(Buffer.from(signingString, 'utf-8'));

    const request: ClaimChallengeRequest = {
        time,
        nonce,
        challenge_id: challengeId,
        wallet_id: walletId,
        wallet_signature: walletSignature,
    };

    const response = await fetchWithTimeout(
        `${POWM_API_BASE}/identity-challenges/claim`,
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
        console.error(`[PowmAPI] Failed to claim challenge - HTTP ${response.status}: ${errorBody}`);
        throw new ClaimIdentityChallengeError(
            'REQUEST_FAILED',
            `Failed to claim challenge (HTTP ${response.status})`,
            response.status,
            errorBody
        );
    }

    const claimResponse: ClaimChallengeResponse = await response.json();

    // Verify the challenge Powm signature
    if (!verifyIdentityChallengeSignature(claimResponse.challenge)) {
        throw new ClaimIdentityChallengeError(
            'INVALID_SIGNATURE',
            'Invalid challenge signature from server'
        );
    }

    return claimResponse;
}
