'use strict'

/**
 * Obtain the encoding from an options parameter, which can be either a string
 * or an object with the 'encoding' property.
 *
 * @param {object} options The options parameter.
 * @returns {?string} The encoding, or null.
 */
function resolveEncoding (options) {
  if (typeof options === 'string') {
    return options
  }
  return options && options.encoding ? options.encoding : null
}

module.exports = resolveEncoding
