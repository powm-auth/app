/**
 * Powm API Client
 * Handles communication with the Powm identity challenge server
 */

import type { AcceptChallengeRequest, ClaimChallengeRequest, ClaimChallengeResponse, IdentityChallenge, RejectChallengeRequest } from '@/types/powm';

// Android emulator uses 10.0.2.2 to reach host machine's localhost
// For iOS simulator use 'localhost', for physical device use computer's IP
//const POWM_API_BASE = 'http://10.0.2.2:4443/api';
const POWM_API_BASE = 'https://api.powm.app/v1';
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Fetch with timeout
 */
function fetchWithTimeout(url: string, options: RequestInit, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
    return Promise.race([
        fetch(url, options),
        new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout - server did not respond within 10 seconds')), timeout)
        )
    ]);
}

export class PowmApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public responseBody?: any
    ) {
        super(message);
        this.name = 'PowmApiError';
    }
}

/**
 * Fetch identity challenge details
 */
export async function getIdentityChallenge(
    challengeId: string
): Promise<IdentityChallenge> {
    const response = await fetchWithTimeout(
        `${POWM_API_BASE}/identity-challenges/${challengeId}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[PowmAPI] Failed to fetch challenge - Status: ${response.status}, Body:`, errorBody);
        throw new PowmApiError(
            `Failed to fetch challenge (HTTP ${response.status}): ${response.statusText}`,
            response.status,
            errorBody
        );
    }

    return response.json();
}

/**
 * Claim an identity challenge with the wallet
 */
export async function claimIdentityChallenge(
    request: ClaimChallengeRequest
): Promise<ClaimChallengeResponse> {
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
        throw new PowmApiError(
            `Failed to claim challenge (HTTP ${response.status})`,
            response.status,
            errorBody
        );
    }

    return response.json();
}

/**
 * Accept an identity challenge by providing encrypted identity data
 */
export async function acceptIdentityChallenge(
    request: AcceptChallengeRequest
): Promise<any> {
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
        throw new PowmApiError(
            `Failed to accept challenge (HTTP ${response.status})`,
            response.status,
            errorBody
        );
    }

    return response.json();
}

/**
 * Reject an identity challenge
 */
export async function rejectIdentityChallenge(
    request: RejectChallengeRequest
): Promise<any> {
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
        throw new PowmApiError(
            `Failed to reject challenge (HTTP ${response.status})`,
            response.status,
            errorBody
        );
    }

    return response.json();
}

/**
 * Submit onboarding data to create a new wallet on the server
 */
export async function testOnboardWallet(request: {
    first_name: string;
    middle_names?: string;
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
        `${POWM_API_BASE}/test/onboard`,
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
        throw new PowmApiError(
            `Failed to onboard wallet (HTTP ${response.status})`,
            response.status,
            errorBody
        );
    }

    return response.json();
}

/**
 * Reset the anonymizing key for a wallet
 * This generates a new anonymizing key on the server and returns it
 */
export async function resetAnonymizingKey(request: {
    time: string;
    nonce: string;
    wallet_id: string;
    wallet_signature: string;
}): Promise<{
    wallet_id: string;
    anonymizing_key: string;
    anonymizing_hashing_scheme: string;
}> {
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
        throw new PowmApiError(
            `Failed to reset anonymizing key (HTTP ${response.status})`,
            response.status,
            errorBody
        );
    }

    return response.json();
}
