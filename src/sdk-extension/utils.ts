import { REQUEST_TIMEOUT } from './constants';

/**
 * Fetch with timeout
 */
export function fetchWithTimeout(url: string, options: RequestInit, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
    return Promise.race([
        fetch(url, options),
        new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout - server did not respond within 10 seconds')), timeout)
        )
    ]);
}

