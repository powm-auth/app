/**
 * Wallet Service
 * Handles wallet operations and challenge processing
 */

import { addHistoryItem } from '@/history/storage';
import {
    acceptIdentityChallenge,
    checkAge,
    claimIdentityChallenge,
    rejectIdentityChallenge
} from '@/sdk-extension';
import type { ClaimChallengeResponse, Wallet } from '@/sdk-extension/structs';
import { ATTRIBUTE_DEFINITIONS } from '@/utils/constants';
import { loadWallet, updateWalletFile, withAnonymizingKey, withSigningKey } from '@/wallet/storage';
import { createIdentityChallenge, decryptAndVerifyIdentity, decryptIdentityChallengeResponse, waitForCompletedIdentityChallenge } from '@powm/sdk-js';
import { encrypting, keyedHashing, signing } from '@powm/sdk-js/crypto';
import { Buffer } from 'buffer';

const { generateKeyPair } = encrypting;
const { sign } = signing;
const { hash } = keyedHashing;

// Current wallet instance cache
let currentWallet: Wallet | null = null;

export function getAttributeDisplayName(key: string): string {
    if (ATTRIBUTE_DEFINITIONS[key]) {
        return ATTRIBUTE_DEFINITIONS[key].label;
    }
    // Fallback: replace underscores with spaces and capitalize words
    console.warn(`Display name not found for attribute key: ${key}`);
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Sort attribute keys based on the standard display order
 */
export function sortAttributeKeys(keys: string[]): string[] {
    const displayOrder = Object.keys(ATTRIBUTE_DEFINITIONS);
    return [...keys].sort((a, b) => {
        const indexA = displayOrder.indexOf(a);
        const indexB = displayOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
}

/**
 * Load and cache the current wallet
 * @param forceReload - If true, reload from storage even if cached
 */
export async function loadCurrentWallet(forceReload: boolean = false): Promise<Wallet | null> {
    if (!currentWallet || forceReload) {
        currentWallet = await loadWallet();
    }
    return currentWallet;
}

/**
 * Get the cached current wallet
 */
export function getCurrentWallet(): Wallet | null {
    return currentWallet;
}

/**
 * Parse challenge ID from scanned data
 * Supports both raw challenge IDs and powm:// protocol URLs
 */
export function parseChallengeId(scannedData: string): string {
    const trimmed = scannedData.trim();

    // Check for powm:// protocol
    if (trimmed.startsWith('powm://')) {
        // Extract challenge ID from URL
        // Format could be: powm://challenge/{id} or powm://{id}
        const match = trimmed.match(/powm:\/\/(?:challenge\/)?([a-z0-9_]+)/i);
        if (match && match[1]) {
            return match[1];
        }
    }

    // Return as-is if it looks like a challenge ID (alphanumeric + underscores)
    if (/^[a-z0-9_]+$/i.test(trimmed)) {
        return trimmed;
    }

    throw new Error('Invalid challenge ID format');
}

/**
 * Claim an identity challenge
 * Signs and submits claim request to Powm server
 */
export async function claimChallenge(
    challengeId: string,
    wallet: Wallet
): Promise<ClaimChallengeResponse> {
    const signer = async (data: Uint8Array) => {
        return await withSigningKey((privateKey) => {
            const signature = sign(
                wallet.signing_algorithm,
                privateKey,
                data as any
            );
            return Buffer.from(signature).toString('base64');
        });
    };

    return await claimIdentityChallenge(challengeId, wallet.id, signer);
}

/**
 * Accept an identity challenge
 * Encrypts identity attributes and submits acceptance to Powm server
 */
export async function acceptChallenge(
    challengeId: string,
    wallet: Wallet,
    claimResponse: ClaimChallengeResponse
): Promise<void> {
    const signer = async (data: Uint8Array) => {
        return await withSigningKey((privateKey) => {
            const signature = sign(
                wallet.signing_algorithm,
                privateKey,
                data as any
            );
            return Buffer.from(signature).toString('base64');
        });
    };

    const anonymizer = async (data: Uint8Array) => {
        return await withAnonymizingKey((anonymizingKey) => {
            const hashBytes = hash(
                wallet.anonymizing_hashing_scheme,
                anonymizingKey,
                data as any
            );
            return hashBytes;
        });
    };

    const getAnonymizingKey = async () => {
        return await withAnonymizingKey((key) => key.toString('base64'));
    };

    await acceptIdentityChallenge(
        challengeId,
        wallet,
        claimResponse,
        signer,
        anonymizer,
        getAnonymizingKey
    );

    // Add to history
    await addHistoryItem({
        requester_id: claimResponse.claim.requester_id,
        requester_type: claimResponse.claim.requester_type,
        requester_display_name: claimResponse.claim.requester_display_name || undefined,
        result: 'accepted',
        attributes_requested: claimResponse.challenge.identity_attributes
    });

    // Increment approved shares count
    if (!wallet.stats) {
        wallet.stats = { approved_shares: 0 };
    }
    wallet.stats.approved_shares += 1;
    wallet.updated_at = new Date();
    await updateWalletFile(wallet);
}

/**
 * Reject an identity challenge
 * Computes identity hash for zero-knowledge proof and submits rejection to Powm server
 */
export async function rejectChallenge(
    challengeId: string,
    wallet: Wallet,
    claimResponse: ClaimChallengeResponse
): Promise<void> {
    const signer = async (data: Uint8Array) => {
        return await withSigningKey((privateKey) => {
            const signature = sign(
                wallet.signing_algorithm,
                privateKey,
                data as any
            );
            return Buffer.from(signature).toString('base64');
        });
    };

    await rejectIdentityChallenge(challengeId, wallet.id, signer);

    // Add to history
    await addHistoryItem({
        requester_id: claimResponse.claim.requester_id,
        requester_type: claimResponse.claim.requester_type,
        requester_display_name: claimResponse.claim.requester_display_name || undefined,
        result: 'rejected',
        attributes_requested: claimResponse.challenge.identity_attributes
    });
}

/**
 * Create a wallet-to-wallet identity challenge
 */
export async function createWalletChallenge(
    wallet: Wallet,
    attributes: string[]
): Promise<{ challengeId: string; privateKey: Buffer; challenge: any }> {
    const encryptingScheme = 'ecdhp256_hkdfsha256_aes256gcm';
    const ephemeralKeys = generateKeyPair(encryptingScheme);
    const publicKeyB64 = Buffer.from(ephemeralKeys.publicKeySpkiDer).toString('base64');

    // Use withSigningKey to sign the challenge
    const challenge = await withSigningKey(async (privateKey) => {
        const signingPrivateKeyB64 = privateKey.toString('base64');
        return await createIdentityChallenge(
            wallet.id,
            attributes,
            encryptingScheme,
            publicKeyB64,
            wallet.signing_algorithm,
            signingPrivateKeyB64
        );
    });

    return {
        challengeId: challenge.challenge_id,
        privateKey: Buffer.from(ephemeralKeys.privateKeyPkcs8Der),
        challenge: challenge
    };
}

/**
 * Poll for challenge completion and decrypt identity
 * Polls with a long timeout to allow for challenge completion
 */
export async function pollChallenge(
    challengeId: string,
    privateKey: Buffer,
    onStatus?: (status: string) => void
): Promise<any> {
    try {
        // Wait for challenge to be complete
        const completedChallenge = await waitForCompletedIdentityChallenge(
            challengeId
        );

        // Decrypt the challenge response
        const response = decryptIdentityChallengeResponse(
            completedChallenge,
            privateKey.toString('base64')
        );

        if (onStatus) onStatus(response.status);

        if (response.status === 'accepted') {
            const acceptance = response.data as any;
            const identity = await decryptAndVerifyIdentity(
                completedChallenge,
                acceptance,
                privateKey.toString('base64')
            );
            return identity;
        } else if (response.status === 'rejected') {
            throw new Error('Challenge was rejected');
        }
    } catch (e: any) {
        console.error('Poll challenge error:', e);
        throw e;
    }
}

/**
 * Refresh age attributes by checking with the server
 */
export async function refreshAgeAttributes(): Promise<void> {
    const wallet = await getCurrentWallet();
    if (!wallet) throw new Error('No wallet loaded');

    const dateOfBirth = wallet.attributes['date_of_birth']?.value;
    if (!dateOfBirth) throw new Error('Date of birth not set in wallet');

    const dateOfBirthSalt = wallet.attributes['date_of_birth']?.salt;
    if (!dateOfBirthSalt) throw new Error('Date of birth salt not set in wallet');

    const signer = async (data: Uint8Array) => {
        return await withSigningKey((privateKey) => {
            const signature = sign(
                wallet.signing_algorithm,
                privateKey,
                data as any
            );
            return Buffer.from(signature).toString('base64');
        });
    };

    // Call API
    const response = await checkAge(
        wallet.id,
        dateOfBirth,
        dateOfBirthSalt,
        signer
    );

    // Update wallet attributes
    const updatedAttributes = { ...wallet.attributes };
    for (const [key, data] of Object.entries(response.identity_attributes)) {
        updatedAttributes[key] = {
            value: data.value,
            salt: data.salt
        };
    }

    wallet.attributes = updatedAttributes;
    wallet.updated_at = new Date();

    // Save updated wallet
    await updateWalletFile(wallet);
    currentWallet = wallet;
}

