/**
 * Obtain the encoding from an options parameter, which can be either a string
 * or an object with the 'encoding' property.
 *
 * @param {object} options The options parameter.
 * @returns {?string} The encoding, or undefined.
 */
export default function resolveEncoding (options: undefined | BufferEncoding | { encoding?: BufferEncoding }): BufferEncoding | undefined {
  if (typeof options === 'string') {
    return options
  }
  return options?.encoding ?? undefined
}
