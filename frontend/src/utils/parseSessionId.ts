const SESSION_ID_REGEX = /^\d+$/;

export function parseSessionIdParam(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === '') {
    return undefined;
  }
  if (!SESSION_ID_REGEX.test(raw)) {
    return undefined;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 1) {
    return undefined;
  }
  return n;
}
