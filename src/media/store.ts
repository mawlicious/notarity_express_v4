import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";

const MAX_PDF_BYTES = 35 * 1024 * 1024;

export class MediaStore {
  constructor(private readonly root: string) {}

  async save(data: Buffer, originalName: string, mimeType: string): Promise<{ id: string; path: string }> {
    if (mimeType === "application/pdf" && data.byteLength > MAX_PDF_BYTES) throw new Error("PDF exceeds 35 MB");
    await mkdir(this.root, { recursive: true });
    const id = randomUUID();
    const extension = extname(originalName).slice(0, 10);
    const path = join(this.root, `${id}${extension}`);
    await writeFile(path, data, { mode: 0o600 });
    return { id, path };
  }

  async remove(path: string): Promise<void> {
    await rm(path, { force: true });
  }

  async exists(path: string): Promise<boolean> {
    return stat(path).then(() => true, () => false);
  }
}
