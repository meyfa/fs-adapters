/**
 * Determine if the argument is a non-null object with the property 'code' (which is of some unknown type).
 *
 * @param err The object to check.
 * @returns Whether it is safe to access the argument's code property.
 */
function hasCode (err: unknown): err is { code: unknown } {
  if (typeof err !== 'object' || err == null) {
    return false
  }
  return 'code' in err
}

/**
 * Obtain the argument's code string, if possible, and undefined otherwise.
 *
 * @param err The error argument.
 * @returns The error code, or undefined if inaccessible.
 */
export function getErrorCode (err: unknown): string | undefined {
  return hasCode(err) && typeof err.code === 'string' ? err.code : undefined
}
