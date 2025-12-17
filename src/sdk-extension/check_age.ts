import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { Signer } from './claim_identity_challenge';
import { POWM_API_BASE } from './constants';
import { CheckAgeError } from './structs';
import { fetchWithTimeout } from './utils';

export async function checkAge(
    walletId: string,
    dateOfBirth: string,
    dateOfBirthSalt: string,
    signer: Signer
): Promise<{
    wallet_id: string;
    age: number;
    identity_attributes: Record<string, { value: string; salt: string }>;
}> {
    const time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const nonce = btoa(String.fromCharCode(...Crypto.getRandomBytes(32)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 32);

    const signingString = `v1/wallets/check-age|${time}|${nonce}|${walletId}|${dateOfBirth}|${dateOfBirthSalt}|`;
    const walletSignature = await signer(Buffer.from(signingString, 'utf-8'));

    const request = {
        time,
        nonce,
        wallet_id: walletId,
        date_of_birth: dateOfBirth,
        date_of_birth_salt: dateOfBirthSalt,
        wallet_signature: walletSignature,
    };

    const response = await fetchWithTimeout(
        `${POWM_API_BASE}/wallets/check-age`,
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
        console.error(`[PowmAPI] Failed to check age - HTTP ${response.status}: ${errorBody}`);
        throw new CheckAgeError(
            'REQUEST_FAILED',
            `Failed to check age (HTTP ${response.status})`,
            response.status,
            errorBody
        );
    }

    return response.json();
}

