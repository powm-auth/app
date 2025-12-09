/**
 * Wallet types for Powm identity protocol
 */

export interface Wallet {
    id: string;
    created_at: string;
    updated_at: string;
    private_key: string; // PEM format
    public_key: string; // PEM format
    algorithm: 'EcdsaP256_Sha256' | 'EdDSA-Ed25519';
    attributes: Record<string, string>;
}

export interface IdentityChallenge {
    id: string;
    app_id: string;
    requested_attributes: string[];
    encrypting_scheme: string;
    status: 'pending' | 'claimed' | 'accepted' | 'rejected' | 'expired';
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
        identity_attribute_hashing_scheme: string;
        identity_attribute_hashing_salts: Record<string, string>;
        encrypting_application_key: string;
    };
    challenge: {
        challenge_id: string;
        encrypting_scheme: string;
        expires_at: string;
    };
}

export interface AcceptChallengeRequest {
    time: string;
    nonce: string;
    challenge_id: string;
    wallet_id: string;
    identity_hash: string;
    identity_encrypting_wallet_key: string;
    identity_encrypting_nonce: string;
    identity_encrypted: string;
    wallet_signature: string;
}
