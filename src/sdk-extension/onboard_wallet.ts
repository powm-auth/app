import { Buffer } from 'buffer';
import { POWM_API_BASE } from './constants';
import { OnboardWalletError } from './structs';
import { fetchWithTimeout } from './utils';

export async function onboardWallet(request: {
    signing_scheme: string;
    signing_public_key: Uint8Array;
}): Promise<{
    wallet_id: string;
    anonymizing_key: string;
    anonymizing_hashing_scheme: string;
    identity_attribute_hashing_scheme: string;
}> {
    const requestBody = {
        signing_scheme: request.signing_scheme,
        signing_public_key: Buffer.from(request.signing_public_key).toString('base64'), // Convert to base64 string
        time: new Date().toISOString(),
        nonce: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    };

    const response = await fetchWithTimeout(
        `${POWM_API_BASE}/wallets/register`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[PowmAPI] Failed to onboard wallet - HTTP ${response.status}: ${errorBody}`);
        throw new OnboardWalletError(
            'REQUEST_FAILED',
            `Failed to onboard wallet (HTTP ${response.status})`,
            response.status,
            errorBody
        );
    }

    return response.json();
}
