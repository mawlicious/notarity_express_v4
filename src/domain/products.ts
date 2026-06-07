import type { Product } from "./types.js";

export function resolveMandatoryProducts(selectedIds: string[], products: Product[]): string[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  const resolved = new Set(selectedIds);
  const queue = [...selectedIds];
  while (queue.length) {
    const product = byId.get(queue.shift()!);
    for (const required of product?.requiredProducts ?? []) {
      if (!resolved.has(required)) {
        resolved.add(required);
        queue.push(required);
      }
    }
  }
  return [...resolved];
}
