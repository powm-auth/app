/**
 * Powm API Client
 * Handles communication with the Powm identity challenge server
 */

import type { AcceptChallengeRequest, ClaimChallengeRequest, ClaimChallengeResponse, IdentityChallenge } from '@/types/powm';

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

/**
 * Parse JSON response with UTF-8 BOM handling
 */
async function parseJsonResponse(response: Response): Promise<any> {
    let text = await response.text();

    // Remove UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        throw new PowmApiError(
            `Invalid JSON response from server: ${text.substring(0, 200)}`,
            response.status,
            text
        );
    }
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

    return parseJsonResponse(response);
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

    return parseJsonResponse(response);
}

/**
 * Reject an identity challenge
 */
export async function rejectIdentityChallenge(request: {
    time: string;
    nonce: string;
    challenge_id: string;
    wallet_id: string;
    identity_hash: string;
    wallet_signature: string;
}): Promise<any> {
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

    return parseJsonResponse(response);
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

    return parseJsonResponse(response);
}
