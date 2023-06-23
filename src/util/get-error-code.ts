/**
 * Obtain the argument's code string, if possible, and undefined otherwise.
 * @param err The error argument.
 * @returns The error code, or undefined if inaccessible.
 */
export function getErrorCode (err: unknown): string | undefined {
  return typeof err === 'object' && err != null && 'code' in err && typeof err.code === 'string'
    ? err.code
    : undefined
}
