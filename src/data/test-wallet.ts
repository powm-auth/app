/**
 * Test wallet data
 * TODO: Replace with secure storage (Expo SecureStore)
 */

import type { Wallet } from '@/types/powm';

export const TEST_WALLET: Wallet = {
    created_at: '2025-11-30T04:02:00.229921+00:00',
    updated_at: '2025-11-30T04:05:12.005368+00:00',
    private_key: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgW0ioOcEBcfz1tBGb
bvk3l14cqD1/2wqsSWb3a3c5NhqhRANCAASVaaYv10RN9GJ69u35s9K2OUiKMto1
JBm9LEHt5ZO/uXK8XnSritwp4kmXcAZaj/gU/f0Bsd3TFNSAZqFNXfny
-----END PRIVATE KEY-----
`,
    public_key: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAElWmmL9dETfRievbt+bPStjlIijLa
NSQZvSxB7eWTv7lyvF50q4rcKeJJl3AGWo/4FP39AbHd0xTUgGahTV358g==
-----END PUBLIC KEY-----
`,
    algorithm: 'EcdsaP256_Sha256',
    attributes: {
        first_name: 'John',
        last_name: 'Doe',
    },
    id: 'wlt_xksx62zbmxxjwz39dmt25vcgc8s4fp9qlpvmr9o',
};
