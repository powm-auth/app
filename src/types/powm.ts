/**
 * Wallet types for Powm identity protocol
 */

export interface Wallet {
    id: string;
    created_at: Date;
    updated_at: Date | null;
    private_key: Buffer; // PKCS8 DER
    public_key: Buffer; // SPKI DER
    signing_algorithm: string;
    identity_attribute_hashing_scheme: string;
    attributes: Record<string, { value: string; salt: string }>;
}

export interface IdentityChallenge {
    id: string;
    app_id: string;
    requested_attributes: string[];
    encrypting_scheme: string;
    created_at: string;
    expires_at: string;
    app_ephemeral_encrypting_public_key?: string;
    wallet_ephemeral_encrypting_public_key?: string;
    wallet_id?: string;
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
        application_display_name: string;
        encrypting_application_key: string;
        claimed_at: string;
        reclaimed: boolean;
        wallet_id: string;
    };
    challenge: {
        challenge_id: string;
        encrypting_scheme: string;
        expires_at: string;
        identity_attributes: string[]; // Pre-sorted array from server
    };
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
    wallet_signature: string;
}
