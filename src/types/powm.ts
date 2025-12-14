import { IdentityChallenge } from '@powm/sdk-js';

/**
 * Wallet types for Powm identity protocol
 */

export { IdentityChallenge };

export interface Wallet {
    id: string;
    created_at: Date;
    updated_at: Date | null;
    public_key: Buffer; // SPKI DER
    signing_algorithm: string;
    identity_attribute_hashing_scheme: string;
    anonymizing_hashing_scheme: string;
    attributes: Record<string, { value: string; salt: string }>;
}

export interface ClaimChallengeRequest {
    time: string;
    nonce: string;
    challenge_id: string;
    wallet_id: string;
    wallet_signature: string;
}

export interface ClaimChallengeResponse {
    claim: {
        requester_id: string;
        requester_type: 'application' | 'wallet';
        requester_display_name: string | null;
        encrypting_requester_key: string;
        claimed_at: string;
        reclaimed: boolean;
        wallet_id: string;
        // ADD SIGNATURE!!!!
    };
    challenge: IdentityChallenge;
}

export interface AcceptChallengeRequest {
    time: string;
    nonce: string;
    challenge_id: string;
    wallet_id: string;
    identity_hash: string;
    identity_attribute_hashing_salts: Record<string, string>; // NEW: Must send salts back to server
    identity_encrypting_wallet_key: string;
    identity_encrypting_nonce: string;
    identity_encrypted: string;
    anonymizing_key?: string;
    wallet_signature: string;
}

export interface RejectChallengeRequest {
    time: string;
    nonce: string;
    challenge_id: string;
    wallet_id: string;
    wallet_signature: string;
}
