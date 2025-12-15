import { Buffer } from 'buffer';
import { REQUEST_TIMEOUT } from './constants';

export function base64ToUint8Array(base64: string): Uint8Array {
    return new Uint8Array(Buffer.from(base64, 'base64'));
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('base64');
}

export function utf8ToUint8Array(str: string): Uint8Array {
    return new Uint8Array(Buffer.from(str, 'utf8'));
}

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

