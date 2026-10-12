const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * 외부에서 온 URL(Notion 값)이 http(s)/mailto일 때만 그대로 돌려주고, 그 밖의 스킴
 * (`javascript:`, `data:` 등)이거나 URL이 아니면 `undefined`를 돌려준다.
 */
export function toSafeUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return ALLOWED_PROTOCOLS.has(new URL(value).protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}
