/**
 * Wallet Secure Storage Service
 * Hybrid approach:
 * - SecureStore: ID, private_key, public_key (most sensitive)
 * - Encrypted file: attributes, metadata (unlimited size)
 */

import type { Wallet } from '@/types/powm';
import { gcm } from '@noble/ciphers/aes';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

// Storage-specific types (serialized formats)
interface WalletSecureData {
    id: string;
    private_key: string; // Base64 PKCS8 DER
    public_key: string; // Base64 SPKI DER
}

interface WalletFileData {
    id: string;
    created_at: string; // ISO 8601
    updated_at: string | null; // ISO 8601
    signing_algorithm: string;
    identity_attribute_hashing_scheme: string;
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

const SECURE_KEYS_STORAGE_KEY = 'powm_wallet_keys';
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
        const secureData = await SecureStore.getItemAsync(SECURE_KEYS_STORAGE_KEY);
        const fileExists = WALLET_FILE.exists;
        return secureData !== null && fileExists;
    } catch (error) {
        console.error('Error checking wallet existence:', error);
        return false;
    }
}

/**
 * Load wallet from hybrid storage
 * @returns Wallet object or null if not found
 */
export async function loadWallet(): Promise<Wallet | null> {
    try {
        // Load secure data from SecureStore
        const secureDataJson = await SecureStore.getItemAsync(SECURE_KEYS_STORAGE_KEY);
        if (!secureDataJson) {
            return null;
        }
        const secureData: WalletSecureData = JSON.parse(secureDataJson);

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

        // Verify ID coherence
        if (secureData.id !== fileData.id) {
            console.error('Wallet ID mismatch between secure storage and file');
            // Delete corrupted wallet data
            await deleteWallet();
            return null;
        }

        // Combine into full wallet object with native types
        const wallet: Wallet = {
            id: secureData.id,
            private_key: Buffer.from(secureData.private_key, 'base64'),
            public_key: Buffer.from(secureData.public_key, 'base64'),
            created_at: new Date(fileData.created_at),
            updated_at: fileData.updated_at ? new Date(fileData.updated_at) : null,
            signing_algorithm: fileData.signing_algorithm,
            identity_attribute_hashing_scheme: fileData.identity_attribute_hashing_scheme,
            attributes: fileData.attributes,
        };

        return wallet;
    } catch (error) {
        console.error('Error loading wallet:', error);
        return null;
    }
}

/**
 * Save wallet to hybrid storage
 * @param wallet - Wallet object to save
 * @returns true if successful, false otherwise
 */
export async function saveWallet(wallet: Wallet): Promise<boolean> {
    try {
        // Split wallet data and convert to storage formats
        const secureData: WalletSecureData = {
            id: wallet.id,
            private_key: wallet.private_key.toString('base64'),
            public_key: wallet.public_key.toString('base64'),
        };

        const fileData: WalletFileData = {
            id: wallet.id,
            attributes: wallet.attributes,
            created_at: wallet.created_at.toISOString(),
            identity_attribute_hashing_scheme: wallet.identity_attribute_hashing_scheme,
            signing_algorithm: wallet.signing_algorithm,
            updated_at: wallet.updated_at ? wallet.updated_at.toISOString() : null,
        };

        // Sort keys for consistent serialization
        const sortedSecureData = sortObjectKeys(secureData);
        const sortedFileData = sortObjectKeys(fileData);

        console.log('[WalletStorage] Saving secure data:', JSON.stringify(sortedSecureData, null, 2));
        console.log('[WalletStorage] Saving file data:', JSON.stringify(sortedFileData, null, 2));

        // Save secure data to SecureStore
        await SecureStore.setItemAsync(SECURE_KEYS_STORAGE_KEY, JSON.stringify(sortedSecureData));

        // Encrypt and save file data
        const encryptionKey = await getFileEncryptionKey();
        const encryptedContent = await encryptWalletFile(JSON.stringify(sortedFileData), encryptionKey);
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
        await SecureStore.deleteItemAsync(SECURE_KEYS_STORAGE_KEY);

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
