declare module 'pdf-poppler' {
  interface ConvertOptions {
    format: 'jpeg' | 'png';
    out_dir: string;
    out_prefix: string;
    page?: number;
  }

  export function convert(
    buffer: Buffer,
    options: ConvertOptions,
  ): Promise<string[]>;
}
