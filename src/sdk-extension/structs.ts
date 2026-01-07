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
    identity_attributes: Record<string, { value: string; salt: string }> | null;
    user_details?: {
        first_name: string;
        last_name: string;
        date_of_birth: string;
    };
    stats: {
        approved_shares: number;
    };
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
        can_accept: boolean;
        identity_attribute_salt_key: string;
        powm_signing_scheme?: string;
        powm_signature?: string;
    };
    challenge: IdentityChallenge;
}

export interface AcceptChallengeRequest {
    time: string;
    nonce: string;
    challenge_id: string;
    wallet_id: string;
    identity_hash: string;
    identity_attribute_info: Record<string, { salt: string; value?: string | null }>;
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

export interface WalletStatusRequest {
    time: string;
    nonce: string;
    wallet_id: string;
    wallet_signature: string;
}

export interface WalletStatusResponse {
    verified: boolean;
    identity_verification: 'not_started' | 'processing' | 'rejected' | 'accepted_awaiting_consumption' | 'completed';
}

export interface StartIdentityVerificationRequest {
    time: string;
    nonce: string;
    wallet_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    success_url: string;
    cancel_url: string;
    wallet_signature: string;
}

export interface StartIdentityVerificationResponse {
    redirect_url: string;
}

export interface ConsumeIdentityVerificationRequest {
    time: string;
    nonce: string;
    wallet_id: string;
    wallet_signature: string;
}

export interface ConsumeIdentityVerificationResponse {
    wallet_id: string;
    identity_attributes: Record<string, { value: string; salt: string }>;
}

// Error types and classes

export type StartIdentityVerificationErrorCode =
    | 'REQUEST_FAILED'
    | 'INVALID_RESPONSE'
    | 'NETWORK_ERROR'
    | 'UNAUTHORIZED'
    | 'UNKNOWN';

export class StartIdentityVerificationError extends Error {
    code: StartIdentityVerificationErrorCode;
    cause?: Error;
    statusCode?: number;
    responseBody?: any;

    constructor(code: StartIdentityVerificationErrorCode, message: string, statusCode?: number, responseBody?: any, cause?: Error) {
        super(message);
        this.code = code;
        this.name = 'StartIdentityVerificationError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.cause = cause;
    }
}

export type ConsumeIdentityVerificationErrorCode =
    | 'REQUEST_FAILED'
    | 'INVALID_RESPONSE'
    | 'NETWORK_ERROR'
    | 'UNAUTHORIZED'
    | 'UNKNOWN';

export class ConsumeIdentityVerificationError extends Error {
    code: ConsumeIdentityVerificationErrorCode;
    cause?: Error;
    statusCode?: number;
    responseBody?: any;

    constructor(code: ConsumeIdentityVerificationErrorCode, message: string, statusCode?: number, responseBody?: any, cause?: Error) {
        super(message);
        this.code = code;
        this.name = 'ConsumeIdentityVerificationError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.cause = cause;
    }
}

export type GetIdentityChallengeErrorCode =
    | 'REQUEST_FAILED'
    | 'INVALID_RESPONSE'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';

export class GetIdentityChallengeError extends Error {
    code: GetIdentityChallengeErrorCode;
    cause?: Error;
    statusCode?: number;
    responseBody?: any;

    constructor(code: GetIdentityChallengeErrorCode, message: string, statusCode?: number, responseBody?: any, cause?: Error) {
        super(message);
        this.code = code;
        this.name = 'GetIdentityChallengeError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.cause = cause;
    }
}

export type ClaimIdentityChallengeErrorCode =
    | 'REQUEST_FAILED'
    | 'INVALID_SIGNATURE'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';

export class ClaimIdentityChallengeError extends Error {
    code: ClaimIdentityChallengeErrorCode;
    cause?: Error;
    statusCode?: number;
    responseBody?: any;

    constructor(code: ClaimIdentityChallengeErrorCode, message: string, statusCode?: number, responseBody?: any, cause?: Error) {
        super(message);
        this.code = code;
        this.name = 'ClaimIdentityChallengeError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.cause = cause;
    }
}

export type CheckWalletStatusErrorCode =
    | 'REQUEST_FAILED'
    | 'INVALID_SIGNATURE'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';

export class CheckWalletStatusError extends Error {
    code: CheckWalletStatusErrorCode;
    cause?: Error;
    statusCode?: number;
    responseBody?: any;

    constructor(code: CheckWalletStatusErrorCode, message: string, statusCode?: number, responseBody?: any, cause?: Error) {
        super(message);
        this.code = code;
        this.name = 'CheckWalletStatusError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.cause = cause;
    }
}

export type AcceptIdentityChallengeErrorCode =
    | 'REQUEST_FAILED'
    | 'ENCRYPTION_ERROR'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';

export class AcceptIdentityChallengeError extends Error {
    code: AcceptIdentityChallengeErrorCode;
    cause?: Error;
    statusCode?: number;
    responseBody?: any;

    constructor(code: AcceptIdentityChallengeErrorCode, message: string, statusCode?: number, responseBody?: any, cause?: Error) {
        super(message);
        this.code = code;
        this.name = 'AcceptIdentityChallengeError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.cause = cause;
    }
}

export type RejectIdentityChallengeErrorCode =
    | 'REQUEST_FAILED'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';

export class RejectIdentityChallengeError extends Error {
    code: RejectIdentityChallengeErrorCode;
    cause?: Error;
    statusCode?: number;
    responseBody?: any;

    constructor(code: RejectIdentityChallengeErrorCode, message: string, statusCode?: number, responseBody?: any, cause?: Error) {
        super(message);
        this.code = code;
        this.name = 'RejectIdentityChallengeError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.cause = cause;
    }
}

export type CheckAgeErrorCode =
    | 'REQUEST_FAILED'
    | 'INVALID_DATE_OF_BIRTH'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';

export class CheckAgeError extends Error {
    code: CheckAgeErrorCode;
    cause?: Error;
    statusCode?: number;
    responseBody?: any;

    constructor(code: CheckAgeErrorCode, message: string, statusCode?: number, responseBody?: any, cause?: Error) {
        super(message);
        this.code = code;
        this.name = 'CheckAgeError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.cause = cause;
    }
}

export type OnboardWalletErrorCode =
    | 'REQUEST_FAILED'
    | 'INVALID_DATA'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';

export class OnboardWalletError extends Error {
    code: OnboardWalletErrorCode;
    cause?: Error;
    statusCode?: number;
    responseBody?: any;

    constructor(code: OnboardWalletErrorCode, message: string, statusCode?: number, responseBody?: any, cause?: Error) {
        super(message);
        this.code = code;
        this.name = 'OnboardWalletError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.cause = cause;
    }
}

export type ResetAnonymizingKeyErrorCode =
    | 'REQUEST_FAILED'
    | 'WALLET_NOT_FOUND'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';

export class ResetAnonymizingKeyError extends Error {
    code: ResetAnonymizingKeyErrorCode;
    cause?: Error;
    statusCode?: number;
    responseBody?: any;

    constructor(code: ResetAnonymizingKeyErrorCode, message: string, statusCode?: number, responseBody?: any, cause?: Error) {
        super(message);
        this.code = code;
        this.name = 'ResetAnonymizingKeyError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.cause = cause;
    }
}

export class DeleteWalletError extends Error {
    constructor(
        public code: string,
        message: string,
        public statusCode?: number,
        public responseBody?: string
    ) {
        super(message);
        this.name = 'DeleteWalletError';
    }
}
export class VerifyClaimSignatureError extends Error {
    code: string;
    cause?: Error;

    constructor(code: string, message: string, cause?: Error) {
        super(message);
        this.code = code;
        this.name = 'VerifyClaimSignatureError';
        this.cause = cause;
    }
}
