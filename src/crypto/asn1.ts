import { Buffer } from 'buffer';

export class Asn1Builder {
    private parts: Buffer[] = [];

    add(buffer: Buffer): this {
        this.parts.push(buffer);
        return this;
    }

    /**
     * Encodes length according to ASN.1 rules
     */
    private encodeLength(length: number): Buffer {
        if (length < 128) {
            return Buffer.from([length]);
        } else if (length < 256) {
            return Buffer.from([0x81, length]);
        } else if (length < 65536) {
            const b1 = length >> 8;
            const b2 = length & 0xff;
            return Buffer.from([0x82, b1, b2]);
        } else {
            throw new Error('Length too large for simple encoding');
        }
    }

    /**
     * Wraps content in a SEQUENCE (0x30)
     */
    sequence(buildFn: (builder: Asn1Builder) => void): this {
        const inner = new Asn1Builder();
        buildFn(inner);
        const content = inner.toBuffer();

        this.parts.push(Buffer.from([0x30]));
        this.parts.push(this.encodeLength(content.length));
        this.parts.push(content);
        return this;
    }

    /**
     * Appends an INTEGER (0x02)
     */
    integer(value: number): this {
        // Simple integer encoding for small values (0-127)
        if (value < 0 || value > 127) throw new Error('Only small positive integers supported currently');
        this.parts.push(Buffer.from([0x02, 0x01, value]));
        return this;
    }

    /**
     * Appends an OCTET STRING (0x04)
     */
    octetString(data: Uint8Array): this {
        this.parts.push(Buffer.from([0x04]));
        this.parts.push(this.encodeLength(data.length));
        this.parts.push(Buffer.from(data));
        return this;
    }

    /**
     * Appends a BIT STRING (0x03)
     */
    bitString(data: Uint8Array, unusedBits: number = 0): this {
        this.parts.push(Buffer.from([0x03]));
        this.parts.push(this.encodeLength(data.length + 1));
        this.parts.push(Buffer.from([unusedBits]));
        this.parts.push(Buffer.from(data));
        return this;
    }

    /**
     * Appends an OBJECT IDENTIFIER (0x06)
     */
    oid(oidBytes: number[]): this {
        const buffer = Buffer.from(oidBytes);
        this.parts.push(Buffer.from([0x06]));
        this.parts.push(this.encodeLength(buffer.length));
        this.parts.push(buffer);
        return this;
    }

    /**
     * Appends a context-specific tag (e.g. [0], [1])
     */
    contextSpecific(tag: number, buildFn: (builder: Asn1Builder) => void): this {
        const inner = new Asn1Builder();
        buildFn(inner);
        const content = inner.toBuffer();

        // Tag is 0xA0 + tag number (for constructed context-specific)
        this.parts.push(Buffer.from([0xA0 | tag]));
        this.parts.push(this.encodeLength(content.length));
        this.parts.push(content);
        return this;
    }

    toBuffer(): Buffer {
        return Buffer.concat(this.parts);
    }
}

export class Asn1Parser {
    private buffer: Buffer;
    private offset: number = 0;

    constructor(buffer: Buffer) {
        this.buffer = buffer;
    }

    private readLength(): number {
        let length = this.buffer[this.offset++];
        if (length & 0x80) {
            const bytes = length & 0x7f;
            length = 0;
            for (let i = 0; i < bytes; i++) {
                length = (length << 8) | this.buffer[this.offset++];
            }
        }
        return length;
    }

    /**
     * Expects a SEQUENCE and returns a new parser for its content
     */
    readSequence(): Asn1Parser {
        if (this.buffer[this.offset++] !== 0x30) throw new Error('Expected SEQUENCE');
        const length = this.readLength();
        const content = this.buffer.subarray(this.offset, this.offset + length);
        this.offset += length;
        return new Asn1Parser(content);
    }

    /**
     * Reads an OCTET STRING
     */
    readOctetString(): Buffer {
        if (this.buffer[this.offset++] !== 0x04) throw new Error('Expected OCTET STRING');
        const length = this.readLength();
        const content = this.buffer.subarray(this.offset, this.offset + length);
        this.offset += length;
        return content;
    }

    /**
     * Reads a BIT STRING (returns content without unused bits byte)
     */
    readBitString(): Buffer {
        if (this.buffer[this.offset++] !== 0x03) throw new Error('Expected BIT STRING');
        const length = this.readLength();
        // Skip unused bits byte
        this.offset++;
        const content = this.buffer.subarray(this.offset, this.offset + length - 1);
        this.offset += length - 1;
        return content;
    }

    /**
     * Skips the next element (useful for ignoring OIDs or Versions)
     */
    skip(): void {
        // Read tag
        this.offset++;
        // Read length
        const length = this.readLength();
        this.offset += length;
    }

    /**
     * Finds an OCTET STRING inside the current sequence (recursive search helper)
     * Useful for finding private keys in complex structures
     */
    findOctetStringWithTag(tag: number): Buffer | null {
        // Reset offset to scan
        let scanOffset = 0;
        while (scanOffset < this.buffer.length) {
            const currentTag = this.buffer[scanOffset];

            // Decode length
            let lenOffset = scanOffset + 1;
            let length = this.buffer[lenOffset++];
            if (length & 0x80) {
                const bytes = length & 0x7f;
                length = 0;
                for (let i = 0; i < bytes; i++) {
                    length = (length << 8) | this.buffer[lenOffset++];
                }
            }
            const contentStart = lenOffset;
            const nextOffset = contentStart + length;

            if (currentTag === 0x04) {
                // Check if this OCTET STRING looks like what we want (by checking first byte if provided)
                if (tag === -1 || (length > 0 && this.buffer[contentStart] === tag)) {
                    // This is a heuristic for the specific structure we know
                    // But for now, let's just return the content
                    return this.buffer.subarray(contentStart, nextOffset);
                }
            }

            // If it's a sequence or context specific, we might want to recurse, 
            // but for our specific use case, a linear scan or specific path is better.

            scanOffset = nextOffset;
        }
        return null;
    }

    get remaining(): Buffer {
        return this.buffer.subarray(this.offset);
    }
}
