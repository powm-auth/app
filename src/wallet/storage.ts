/**
 * Wallet Secure Storage Service
 * Hybrid approach:
 * - SecureStore: private_key only (base64, retrieved only for signing)
 * - Encrypted file: id, public_key, attributes, metadata (unlimited size)
 */

import { resetAnonymizingKey } from '@/sdk-extension';
import type { Wallet } from '@/sdk-extension/structs';
import { gcm } from '@noble/ciphers/aes';
import { signing } from '@powm/sdk-js/crypto';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

const { sign } = signing;

// Storage-specific types (serialized formats)
interface WalletFileData {
    id: string;
    public_key: string; // Base64 SPKI DER
    created_at: string; // ISO 8601
    updated_at: string | null; // ISO 8601
    signing_algorithm: string;
    identity_attribute_hashing_scheme: string;
    anonymizing_hashing_scheme: string;
    attributes: Record<string, { value: string; salt: string }>;
}

/**
 * Sort object keys alphabetically for consistent serialization
 */
function sortObjectKeys<T extends Record<string, any>>(obj: T): T {
    const sorted = {} as T;
    Object.keys(obj)
        .sort()
        .forEach(key => {
            const value = obj[key];
            // Recursively sort nested objects
            if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Buffer) && !(value instanceof Date)) {
                sorted[key as keyof T] = sortObjectKeys(value);
            } else {
                sorted[key as keyof T] = value;
            }
        });
    return sorted;
}

const SIGNING_PRIVATE_KEY_STORAGE_KEY = 'powm_wallet_signing_private_key';
const ANONYMIZING_KEY_STORAGE_KEY = 'powm_wallet_anonymizing_key';
const WALLET_FILE = new File(Paths.document, 'wallet_data.enc');
const ENCRYPTION_KEY_STORAGE_KEY = 'powm_wallet_encryption_key';

/**
 * Generate or retrieve encryption key for wallet file
 */
async function getFileEncryptionKey(): Promise<string> {
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
    if (!key) {
        // Generate 32-byte key (256 bits)
        const keyBytes = Crypto.getRandomBytes(32);
        key = Buffer.from(keyBytes).toString('base64');
        await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, key);
    }
    return key;
}

/**
 * Check if a wallet exists in storage
 * @returns true if wallet exists, false otherwise
 */
export async function hasWallet(): Promise<boolean> {
    try {
        const privateKey = await SecureStore.getItemAsync(SIGNING_PRIVATE_KEY_STORAGE_KEY);
        const fileExists = WALLET_FILE.exists;
        return privateKey !== null && fileExists;
    } catch (error) {
        console.error('Error checking wallet existence:', error);
        return false;
    }
}

/**
 * Load wallet from hybrid storage (without private key)
 * Private key is only retrieved when needed for signing via withPrivateKey()
 * @returns Wallet object or null if not found
 */
export async function loadWallet(): Promise<Wallet | null> {
    try {
        // Check that private key exists (but don't load it)
        const hasPrivateKey = await SecureStore.getItemAsync(SIGNING_PRIVATE_KEY_STORAGE_KEY);
        if (!hasPrivateKey) {
            return null;
        }

        // Load and decrypt file data
        const fileExists = WALLET_FILE.exists;
        if (!fileExists) {
            console.error('Wallet file not found');
            return null;
        }

        const encryptedContent = await WALLET_FILE.text();
        const encryptionKey = await getFileEncryptionKey();

        // Decrypt file content
        const decryptedJson = await decryptWalletFile(encryptedContent, encryptionKey);
        const fileData: WalletFileData = JSON.parse(decryptedJson);

        // Build wallet object with native types (no private key)
        const wallet: Wallet = {
            id: fileData.id,
            public_key: Buffer.from(fileData.public_key, 'base64'),
            created_at: new Date(fileData.created_at),
            updated_at: fileData.updated_at ? new Date(fileData.updated_at) : null,
            signing_algorithm: fileData.signing_algorithm,
            identity_attribute_hashing_scheme: fileData.identity_attribute_hashing_scheme,
            anonymizing_hashing_scheme: fileData.anonymizing_hashing_scheme,
            attributes: fileData.attributes,
        };

        return wallet;
    } catch (error) {
        console.error('Error loading wallet:', error);
        return null;
    }
}

/**
 * Execute a function with the signing private key, then dispose of it
 * This ensures the private key is only in memory for the minimum time needed
 * @param callback - Function that receives the private key buffer and returns a result
 * @returns The result of the callback
 */
export async function withSigningKey<T>(
    callback: (privateKey: Buffer) => T | Promise<T>
): Promise<T> {
    const privateKeyB64 = await SecureStore.getItemAsync(SIGNING_PRIVATE_KEY_STORAGE_KEY);
    if (!privateKeyB64) {
        throw new Error('Signing private key not found in secure storage');
    }

    // Convert to buffer
    let privateKey: Buffer | null = Buffer.from(privateKeyB64, 'base64');

    try {
        // Execute the callback with the private key
        const result = await callback(privateKey);
        return result;
    } finally {
        // Zero out the buffer to dispose of the key material
        if (privateKey) {
            privateKey.fill(0);
            privateKey = null;
        }
    }
}

/**
 * Execute a function with the anonymizing key (HMAC-SHA512), then dispose of it
 * This key is used for generating anonymous identifiers
 * @param callback - Function that receives the anonymizing key buffer and returns a result
 * @returns The result of the callback
 */
export async function withAnonymizingKey<T>(
    callback: (anonymizingKey: Buffer) => T | Promise<T>
): Promise<T> {
    const keyB64 = await SecureStore.getItemAsync(ANONYMIZING_KEY_STORAGE_KEY);
    if (!keyB64) {
        throw new Error('Anonymizing key not found in secure storage');
    }

    // Convert to buffer
    let anonymizingKey: Buffer | null = Buffer.from(keyB64, 'base64');

    try {
        // Execute the callback with the anonymizing key
        const result = await callback(anonymizingKey);
        return result;
    } finally {
        // Zero out the buffer to dispose of the key material
        if (anonymizingKey) {
            anonymizingKey.fill(0);
            anonymizingKey = null;
        }
    }
}

/**
 * Save wallet to hybrid storage
 * @param wallet - Wallet object to save
 * @param signingPrivateKey - Signing private key buffer (required for saving)
 * @param anonymizingKey - HMAC-SHA512 anonymizing key buffer (required for saving)
 * @returns true if successful, false otherwise
 */
export async function saveWallet(
    wallet: Wallet,
    signingPrivateKey: Buffer,
    anonymizingKey: Buffer
): Promise<boolean> {
    try {
        // Store keys as raw base64 in SecureStore
        // Ensure proper Buffer conversion for base64 encoding
        const signingPrivateKeyB64 = Buffer.from(signingPrivateKey).toString('base64');
        const anonymizingKeyB64 = Buffer.from(anonymizingKey).toString('base64');

        // Ensure public_key is properly converted to base64
        const publicKeyB64 = Buffer.from(wallet.public_key).toString('base64');

        const fileData: WalletFileData = {
            id: wallet.id,
            public_key: publicKeyB64,
            attributes: wallet.attributes,
            created_at: wallet.created_at.toISOString(),
            identity_attribute_hashing_scheme: wallet.identity_attribute_hashing_scheme,
            anonymizing_hashing_scheme: wallet.anonymizing_hashing_scheme,
            signing_algorithm: wallet.signing_algorithm,
            updated_at: wallet.updated_at ? wallet.updated_at.toISOString() : null,
        };

        // Sort keys for consistent serialization
        const sortedFileData = sortObjectKeys(fileData);

        console.log('[WalletStorage] Saving file data:', JSON.stringify(sortedFileData, null, 2));

        // Save keys as raw base64 to SecureStore
        await SecureStore.setItemAsync(SIGNING_PRIVATE_KEY_STORAGE_KEY, signingPrivateKeyB64);
        await SecureStore.setItemAsync(ANONYMIZING_KEY_STORAGE_KEY, anonymizingKeyB64);

        // Encrypt and save file data
        const encryptionKey = await getFileEncryptionKey();
        const encryptedContent = await encryptWalletFile(JSON.stringify(sortedFileData), encryptionKey);

        // Delete existing file if it exists, then create and write
        if (WALLET_FILE.exists) {
            await WALLET_FILE.delete();
        }
        await WALLET_FILE.create();
        await WALLET_FILE.write(encryptedContent);

        console.log('Wallet saved successfully to hybrid storage');
        return true;
    } catch (error) {
        console.error('Error saving wallet:', error);
        return false;
    }
}

/**
 * Delete wallet from hybrid storage
 * @returns true if successful, false otherwise
 */
export async function deleteWallet(): Promise<boolean> {
    try {
        await SecureStore.deleteItemAsync(SIGNING_PRIVATE_KEY_STORAGE_KEY);
        await SecureStore.deleteItemAsync(ANONYMIZING_KEY_STORAGE_KEY);

        const fileExists = WALLET_FILE.exists;
        if (fileExists) {
            await WALLET_FILE.delete();
        }

        console.log('Wallet deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting wallet:', error);
        return false;
    }
}

/**
 * Rotate the anonymizing key via server API
 * This requests a new anonymizing key from the server and stores it locally
 * Use this to invalidate any previously generated anonymous identifiers
 * @returns true if successful, false otherwise
 */
export async function rotateAnonymizingKey(): Promise<boolean> {
    try {
        // Load wallet to get ID and signing algorithm
        const wallet = await loadWallet();
        if (!wallet) {
            throw new Error('No wallet found - cannot rotate anonymizing key');
        }

        // Sign using the wallet's signing key
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

        // Call server API to reset the anonymizing key
        const response = await resetAnonymizingKey(wallet.id, signer);

        // Store the new key from server
        const newKeyB64 = response.anonymizing_key;
        await SecureStore.setItemAsync(ANONYMIZING_KEY_STORAGE_KEY, newKeyB64);

        // Update the anonymizing hashing scheme in wallet file if it changed
        if (response.anonymizing_hashing_scheme !== wallet.anonymizing_hashing_scheme) {
            const updatedWallet: Wallet = {
                ...wallet,
                anonymizing_hashing_scheme: response.anonymizing_hashing_scheme,
                updated_at: new Date(),
            };
            await updateWalletFile(updatedWallet);
        }

        console.log('Anonymizing key rotated successfully via server');
        return true;
    } catch (error) {
        console.error('Error rotating anonymizing key:', error);
        return false;
    }
}

/**
 * Update only the wallet file data (not the secure keys)
 * Used for updating metadata like anonymizing_hashing_scheme
 */
export async function updateWalletFile(wallet: Wallet): Promise<void> {
    const publicKeyB64 = Buffer.from(wallet.public_key).toString('base64');

    const fileData: WalletFileData = {
        id: wallet.id,
        public_key: publicKeyB64,
        attributes: wallet.attributes,
        created_at: wallet.created_at.toISOString(),
        identity_attribute_hashing_scheme: wallet.identity_attribute_hashing_scheme,
        anonymizing_hashing_scheme: wallet.anonymizing_hashing_scheme,
        signing_algorithm: wallet.signing_algorithm,
        updated_at: wallet.updated_at ? wallet.updated_at.toISOString() : null,
    };

    const sortedFileData = sortObjectKeys(fileData);
    const encryptionKey = await getFileEncryptionKey();
    const encryptedContent = await encryptWalletFile(JSON.stringify(sortedFileData), encryptionKey);

    if (WALLET_FILE.exists) {
        await WALLET_FILE.delete();
    }
    await WALLET_FILE.create();
    await WALLET_FILE.write(encryptedContent);
}

/**
 * Check if device supports secure storage
 * @returns true if secure storage is available
 */
export async function isSecureStorageAvailable(): Promise<boolean> {
    try {
        await SecureStore.getItemAsync('__availability_check__');
        return true;
    } catch (error) {
        console.error('Secure storage not available:', error);
        return false;
    }
}

/**
 * Encrypt wallet file data using AES-256-GCM
 */
async function encryptWalletFile(data: string, keyBase64: string): Promise<string> {
    const key = Buffer.from(keyBase64, 'base64');
    const nonce = Crypto.getRandomBytes(12);

    const cipher = gcm(key, nonce);
    const plaintext = Buffer.from(data, 'utf8');

    const result = cipher.encrypt(plaintext);

    // Return nonce + ciphertext + tag as base64
    const combined = Buffer.concat([Buffer.from(nonce), Buffer.from(result)]);
    return combined.toString('base64');
}

/**
 * Decrypt wallet file data using AES-256-GCM
 */
async function decryptWalletFile(encryptedBase64: string, keyBase64: string): Promise<string> {
    const key = Buffer.from(keyBase64, 'base64');
    const combined = Buffer.from(encryptedBase64, 'base64');

    // Extract nonce (first 12 bytes)
    const nonce = combined.subarray(0, 12);
    // The rest is ciphertext || tag, which @noble/ciphers expects
    const ciphertextWithTag = combined.subarray(12);

    const cipher = gcm(key, nonce);
    const decrypted = cipher.decrypt(ciphertextWithTag);

    return Buffer.from(decrypted).toString('utf8');
}
