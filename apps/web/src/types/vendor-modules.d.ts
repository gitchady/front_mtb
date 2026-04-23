declare module "qrcode-generator" {
  type QrCode = {
    addData(data: string): void;
    make(): void;
    getModuleCount(): number;
    isDark(row: number, col: number): boolean;
  };

  export default function qrcode(typeNumber: number, errorCorrectionLevel: string): QrCode;
}

declare module "jsqr" {
  type DecodeOptions = {
    inversionAttempts?: string;
  };

  type DecodeResult = {
    data: string;
  } | null;

  export default function jsQR(data: Uint8ClampedArray, width: number, height: number, options?: DecodeOptions): DecodeResult;
}
