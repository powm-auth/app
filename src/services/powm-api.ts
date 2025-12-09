/**
 * Powm API Client
 * Handles communication with the Powm identity challenge server
 */

import type { AcceptChallengeRequest, ClaimChallengeRequest, ClaimChallengeResponse, IdentityChallenge } from '@/types/powm';

// Android emulator uses 10.0.2.2 to reach host machine's localhost
// For iOS simulator use 'localhost', for physical device use computer's IP
const POWM_API_BASE = 'http://10.0.2.2:4443/api';
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
        throw new PowmApiError(
            `Failed to fetch challenge: ${response.statusText}`,
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
    console.log('Claiming challenge:', {
        url: `${POWM_API_BASE}/identity-challenges/claim`,
        request
    });

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
        console.error('Claim failed:', {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
            url: `${POWM_API_BASE}/identity-challenges/claim`
        });
        throw new PowmApiError(
            `Failed to claim challenge: ${response.statusText} - ${errorBody}`,
            response.status,
            errorBody
        );
    }

    let responseText = await response.text();

    // Remove UTF-8 BOM if present
    if (responseText.charCodeAt(0) === 0xFEFF) {
        responseText = responseText.slice(1);
    }

    console.log('Claim response:', responseText);

    try {
        return JSON.parse(responseText);
    } catch (e) {
        console.error('Failed to parse claim response:', e);
        console.error('Response text:', responseText);
        throw new PowmApiError(
            `Invalid JSON response from server: ${responseText.substring(0, 200)}`,
            response.status,
            responseText
        );
    }
}

/**
 * Accept an identity challenge by providing encrypted identity data
 */
export async function acceptIdentityChallenge(
    request: AcceptChallengeRequest
): Promise<any> {
    console.log('Accepting challenge:', {
        url: `${POWM_API_BASE}/identity-challenges/accept`,
        request
    });

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
        console.error('Accept failed:', {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
            url: `${POWM_API_BASE}/identity-challenges/accept`
        });
        throw new PowmApiError(
            `Failed to accept challenge: ${response.statusText} - ${errorBody}`,
            response.status,
            errorBody
        );
    }

    let responseText = await response.text();

    // Remove UTF-8 BOM if present
    if (responseText.charCodeAt(0) === 0xFEFF) {
        responseText = responseText.slice(1);
    }

    console.log('Accept response:', responseText);

    try {
        return JSON.parse(responseText);
    } catch (e) {
        console.error('Failed to parse accept response:', e);
        throw new PowmApiError(
            `Invalid JSON response from server: ${responseText.substring(0, 200)}`,
            response.status,
            responseText
        );
    }
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
        throw new PowmApiError(
            `Failed to reject challenge: ${response.statusText} - ${errorBody}`,
            response.status,
            errorBody
        );
    }

    let responseText = await response.text();

    // Remove UTF-8 BOM if present
    if (responseText.charCodeAt(0) === 0xFEFF) {
        responseText = responseText.slice(1);
    }

    try {
        return JSON.parse(responseText);
    } catch (e) {
        console.error('Failed to parse reject response:', e);
        throw new PowmApiError(
            `Invalid JSON response from server: ${responseText.substring(0, 200)}`,
            response.status,
            responseText
        );
    }
}
