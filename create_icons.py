"""Generate simple PWA icons (run once)."""
import struct
import zlib


def create_png(width, height, color=(26, 115, 232)):
    """Create a minimal solid-color PNG."""
    r, g, b = color

    # Build raw image data
    raw = b''
    for _ in range(height):
        raw += b'\x00'  # filter byte
        for _ in range(width):
            raw += bytes([r, g, b, 255])

    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw))
    png += chunk(b'IEND', b'')
    return png


if __name__ == '__main__':
    for size in [192, 512]:
        data = create_png(size, size)
        with open(f'static/icons/icon-{size}.png', 'wb') as f:
            f.write(data)
        print(f'Created icon-{size}.png')
