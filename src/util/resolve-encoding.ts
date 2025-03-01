// DYNAMIC TYPING

export function resolveEncoding<E extends BufferEncoding> (options: E | { encoding: E }): E

export function resolveEncoding (options: { encoding?: null } | undefined | null): undefined

export function resolveEncoding (options: Record<any, any> | BufferEncoding | undefined | null): BufferEncoding | undefined

// IMPLEMENTATION

/**
 * Obtain the encoding from an options parameter, which can be either a string
 * or an object with the 'encoding' property.
 *
 * @param options The options parameter.
 * @returns The encoding, or undefined.
 */
export function resolveEncoding (options: Record<any, any> | BufferEncoding | undefined | null): BufferEncoding | undefined {
  if (typeof options === 'string') {
    return options
  }
  return options?.encoding ?? undefined
}
