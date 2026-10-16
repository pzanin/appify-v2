export const MAX_MATERIAL_BYTES = 15 * 1024 * 1024;
const PACKAGED_PDF = /^assets\/documents\/[A-Za-z0-9][A-Za-z0-9._-]{0,158}\.pdf$/i;

export function packagedMaterialFilename(value: unknown) {
  if (typeof value !== 'string' || !PACKAGED_PDF.test(value)) return null;
  return value.split('/').pop() || null;
}

export function isPdfBytes(bytes: Uint8Array) {
  return bytes.byteLength >= 5
    && bytes.byteLength <= MAX_MATERIAL_BYTES
    && bytes[0] === 0x25
    && bytes[1] === 0x50
    && bytes[2] === 0x44
    && bytes[3] === 0x46
    && bytes[4] === 0x2d;
}

export async function readPdfMaterial(file: File) {
  if (!/\.pdf$/i.test(file.name) || file.size <= 0) throw new Error('Selecione um arquivo PDF válido.');
  if (file.size > MAX_MATERIAL_BYTES) throw new Error('O PDF deve ter no máximo 15 MB. Para arquivos maiores, use um link HTTPS.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfBytes(bytes)) throw new Error('O conteúdo do arquivo não corresponde a um PDF válido.');
  return bytes;
}
