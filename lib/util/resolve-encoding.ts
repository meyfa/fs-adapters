// DYNAMIC TYPING

function resolveEncoding<E extends BufferEncoding> (options: E): E

function resolveEncoding<E extends BufferEncoding> (options: { encoding: E }): E

function resolveEncoding (options: { encoding?: null } | undefined | null): undefined

function resolveEncoding (options: Record<any, any> | BufferEncoding | undefined | null): BufferEncoding | undefined

// IMPLEMENTATION

/**
 * Obtain the encoding from an options parameter, which can be either a string
 * or an object with the 'encoding' property.
 *
 * @param {object} options The options parameter.
 * @returns {?string} The encoding, or undefined.
 */
function resolveEncoding (options: Record<any, any> | BufferEncoding | undefined | null): BufferEncoding | undefined {
  if (typeof options === 'string') {
    return options
  }
  return options?.encoding ?? undefined
}

export default resolveEncoding
