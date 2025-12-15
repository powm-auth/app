import { Buffer } from 'buffer';
import { POWM_API_BASE } from './constants';
import { OnboardWalletError } from './structs';
import { fetchWithTimeout } from './utils';

export async function onboardWallet(request: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    birth_country: string;
    gender: string;
    nationality_1: string;
    nationality_2?: string;
    nationality_3?: string;
    signing_scheme: string;
    signing_public_key: Uint8Array;
}): Promise<{
    wallet_id: string;
    identity_attributes: Record<string, { value: string; salt: string }>;
    identity_attribute_hashing_scheme: string;
    anonymizing_key: string;
    anonymizing_hashing_scheme: string;
}> {
    const requestBody = {
        ...request,
        signing_public_key: Buffer.from(request.signing_public_key).toString('base64'), // Convert to base64 string
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
