import { createHash } from "crypto";

export function hashString(str: string): string {
  return createHash("md5").update(str).digest("hex");
}
