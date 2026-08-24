import { promises as fs } from "fs";
import { UpscaleApiError } from "./errors";

export const readImageDimensions = async (path: string) => {
  const handle = await fs.open(path, "r");
  try {
    const buffer = Buffer.alloc(256 * 1024);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const data = buffer.subarray(0, bytesRead);
    if (
      data.length >= 24 &&
      data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
      return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
    }
    if (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8) {
      let offset = 2;
      while (offset + 9 < data.length) {
        if (data[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = data[offset + 1];
        offset += 2;
        if (marker === 0xd8 || marker === 0xd9) continue;
        const length = data.readUInt16BE(offset);
        if (length < 2 || offset + length > data.length) break;
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          return {
            height: data.readUInt16BE(offset + 3),
            width: data.readUInt16BE(offset + 5),
          };
        }
        offset += length;
      }
    }
    if (
      data.length >= 30 &&
      data.subarray(0, 4).toString("ascii") === "RIFF" &&
      data.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
      const type = data.subarray(12, 16).toString("ascii");
      if (type === "VP8X") {
        return {
          width: 1 + data.readUIntLE(24, 3),
          height: 1 + data.readUIntLE(27, 3),
        };
      }
      if (type === "VP8 ") {
        return {
          width: data.readUInt16LE(26) & 0x3fff,
          height: data.readUInt16LE(28) & 0x3fff,
        };
      }
      if (type === "VP8L") {
        const bits = data.readUInt32LE(21);
        return {
          width: (bits & 0x3fff) + 1,
          height: ((bits >> 14) & 0x3fff) + 1,
        };
      }
    }
  } finally {
    await handle.close();
  }
  throw new UpscaleApiError(
    400,
    "INVALID_IMAGE_DIMENSIONS",
    "Could not read image dimensions.",
  );
};
