// types/third-party.d.ts
declare module "pdf-parse" {
  export interface PDFParseResult {
    text: string;
    info?: any;
    metadata?: any;
    version?: string;
    numpages?: number;
    numrender?: number;
  }
  function pdfParse(input: Buffer | Uint8Array | ArrayBuffer): Promise<PDFParseResult>;
  export default pdfParse;
}

declare module "mammoth" {
  export interface ExtractResult {
    value: string; // extracted text
    messages?: Array<{ type: string; message: string }>;
  }
  export function extractRawText(input: { buffer: Buffer | Uint8Array | ArrayBuffer }): Promise<ExtractResult>;
  const mammoth: { extractRawText: typeof extractRawText };
  export default mammoth;
}
