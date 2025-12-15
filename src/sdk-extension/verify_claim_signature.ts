import { signing } from '@powm/sdk-js/crypto';
import { ClaimChallengeResponse, VerifyClaimSignatureError } from './structs';
import { base64ToUint8Array, utf8ToUint8Array } from './utils';

// Copied from @powm/sdk-js/src/constants.ts
const POWM_IDENTITY_CHALLENGE_SIGNING_PUBLIC_KEY_P256 =
    'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEM8YRyFH+50YQREq69694+9YupHRD3c9YoC63KoPY4aLdjdk/43zKUZLwzD2c9zjCyquj3mu+e6nXirfrkzAIeA==';

/**
 * Verify the signature of a claim object against Powm's public key.
 * Returns true if valid, false if signature doesn't match. Throws on invalid input.
 */
export function verifyClaimSignature(claim: ClaimChallengeResponse['claim']): boolean {
    const SCHEME_PUBLIC_KEYS: Record<string, string> = {
        ecdsap256_sha256: POWM_IDENTITY_CHALLENGE_SIGNING_PUBLIC_KEY_P256,
    };

    if (!claim.powm_signing_scheme) throw new VerifyClaimSignatureError('MISSING_SIGNING_SCHEME', 'Missing signing scheme');
    const normalizedScheme = claim.powm_signing_scheme.toLowerCase();
    const publicKeyB64 = SCHEME_PUBLIC_KEYS[normalizedScheme];

    if (!publicKeyB64) {
        throw new VerifyClaimSignatureError(
            'UNSUPPORTED_SIGNING_SCHEME',
            `Unsupported signing scheme: ${claim.powm_signing_scheme}. Supported schemes: ${Object.keys(SCHEME_PUBLIC_KEYS).join(', ')}`
        );
    }

    if (!claim.powm_signature) throw new VerifyClaimSignatureError('MISSING_SIGNATURE', 'Missing signature');

    // Signing string construction based on C# implementation
    const signingString = (
        claim.wallet_id + '|' +
        claim.requester_id + '|' +
        claim.requester_type + '|' +
        (claim.requester_display_name || '') + '|' +
        claim.encrypting_requester_key + '|' +
        (claim.can_accept ? 'true' : 'false') + '|' +
        claim.claimed_at + '|'
    );

    const messageBuffer = utf8ToUint8Array(signingString);
    const signatureBuffer = base64ToUint8Array(claim.powm_signature);

    try {
        return signing.verify(normalizedScheme, publicKeyB64, messageBuffer, signatureBuffer);
    } catch (e) {
        throw new VerifyClaimSignatureError('VERIFICATION_FAILED', 'Verification failed', e as Error);
    }
}
