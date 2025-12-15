import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { Signer } from './claim_identity_challenge';
import { POWM_API_BASE } from './constants';
import { ResetAnonymizingKeyError } from './structs';
import { fetchWithTimeout } from './utils';

export async function resetAnonymizingKey(
    walletId: string,
    signer: Signer
): Promise<{
    wallet_id: string;
    anonymizing_key: string;
    anonymizing_hashing_scheme: string;
}> {
    const time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const nonce = btoa(String.fromCharCode(...Crypto.getRandomBytes(32)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 32);

    const signingString = `${time}|${nonce}|${walletId}|`;
    const walletSignature = await signer(Buffer.from(signingString, 'utf-8'));

    const request = {
        time,
        nonce,
        wallet_id: walletId,
        wallet_signature: walletSignature,
    };

    const response = await fetchWithTimeout(
        `${POWM_API_BASE}/wallets/reset-anonymizing-key`,
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
        console.error(`[PowmAPI] Failed to reset anonymizing key - HTTP ${response.status}: ${errorBody}`);
        throw new ResetAnonymizingKeyError(
            'REQUEST_FAILED',
            `Failed to reset anonymizing key (HTTP ${response.status})`,
            response.status,
            errorBody
        );
    }

    return response.json();
}
