import type { PlatformAdapter } from "./base";
import { LinkedInAdapter } from "./linkedin";

const adapters: PlatformAdapter[] = [new LinkedInAdapter()];

export function detectAdapter(url: string): PlatformAdapter | null {
  return adapters.find((adapter) => adapter.matches(url)) ?? null;
}
