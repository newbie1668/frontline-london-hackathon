import QRCode from "qrcode";

export function encodeQr(text) {
  return QRCode.toDataURL(text, { margin: 1 });
}
