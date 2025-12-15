import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { Signer } from './claim_identity_challenge';
import { POWM_API_BASE } from './constants';
import { RejectChallengeRequest, RejectIdentityChallengeError } from './structs';
import { fetchWithTimeout } from './utils';

export async function rejectIdentityChallenge(
    challengeId: string,
    walletId: string,
    signer: Signer
): Promise<void> {
    const time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const nonce = btoa(String.fromCharCode(...Crypto.getRandomBytes(32)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 32);

    const signingString = `${time}|${nonce}|${challengeId}|${walletId}|`;
    const walletSignature = await signer(Buffer.from(signingString, 'utf-8'));

    const request: RejectChallengeRequest = {
        time,
        nonce,
        challenge_id: challengeId,
        wallet_id: walletId,
        wallet_signature: walletSignature,
    };

    const response = await fetchWithTimeout(`${POWM_API_BASE}/identity-challenges/reject`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[PowmAPI] Failed to reject challenge - HTTP ${response.status}: ${errorBody}`);
        throw new RejectIdentityChallengeError(
            'REQUEST_FAILED',
            `Failed to reject challenge (HTTP ${response.status})`,
            response.status,
            errorBody
        );
    }
}
