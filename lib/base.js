'use strict'

const { WritableStreamBuffer } = require('stream-buffers')
const resolveEncoding = require('./util/resolve-encoding')

class Adapter {
  /**
   * Initialize this adapter.
   *
   * @returns {Promise} A Promise for when initialization is done.
   */
  async init () {
    // do nothing
  }

  /**
   * Obtain a list of file names accessible through this adapter.
   *
   * @abstract
   * @returns {Promise<string[]>} A Promise that resolves to a file name array.
   */
  async listFiles () {
    throw new Error('not implemented')
  }

  /**
   * Checks whether the given file name exists.
   *
   * @abstract
   * @param {string} fileName The name of the file to check.
   * @returns {Promise<boolean>} A promise returning whether or not this file exists.
   */
  async exists (fileName) {
    throw new Error('not implemented')
  }

  /**
   * Rename a file.
   *
   * @abstract
   * @param {string} fileName The old file name.
   * @param {string} newFileName The new file name.
   * @returns {Promise} A Promise that resolves when done, or rejects on error.
   */
  async rename (fileName, newFileName) {
    throw new Error('not implemented')
  }

  /**
   * Delete a file.
   *
   * @abstract
   * @param {string} fileName The name of the file to delete.
   * @returns {Promise} A Promise that resolves when done, or rejects on error.
   */
  async delete (fileName) {
    throw new Error('not implemented')
  }

  /**
   * Create a read stream for the given file name.
   *
   * This should be preferred over read() when the file is potentially large or
   * does not need to be in memory all at once.
   *
   * @abstract
   * @param {string} fileName The name of the file to read.
   * @returns {object} A readable stream for the file.
   */
  createReadStream (fileName) {
    throw new Error('not implemented')
  }

  /**
   * Create a write stream for the given file name.
   *
   * @abstract
   * @param {string} fileName The name of the file to write.
   * @returns {object} A writable stream for the file.
   */
  createWriteStream (fileName) {
    throw new Error('not implemented')
  }

  /**
   * Read the file whole, resolving to its contents as a Buffer.
   * If an encoding is specified, this will convert the buffer to a string and
   * resolve to that.
   *
   * @param {string} fileName The name of the file to read.
   * @param {?(object|string)} options Additional options: encoding.
   * @returns {Promise} Resolves to a Buffer, or rejects on error.
   */
  async read (fileName, options) {
    // DEFAULT IMPLEMENTATION
    // subclasses should override if they can provide better performance

    const encoding = resolveEncoding(options)

    const stream = this.createReadStream(fileName)
    const writable = new WritableStreamBuffer()
    const promise = new Promise((resolve, reject) => {
      // errors are not forwarded with pipe, so listen on original stream
      stream.on('error', err => reject(err))
      writable.on('finish', () => {
        if (encoding) {
          resolve(writable.getContentsAsString(encoding))
        } else {
          resolve(writable.getContents())
        }
      })
    })
    stream.pipe(writable)
    return promise
  }

  /**
   * Write to the given file name.
   *
   * @param {string} fileName The name of the file to write.
   * @param {Buffer} data The data to write.
   * @param {?(object|string)} options Additional options: encoding.
   * @returns {Promise} Resolves when done, or rejects on error.
   */
  async write (fileName, data, options) {
    // DEFAULT IMPLEMENTATION
    // subclasses should override if they can provide better performance

    const encoding = resolveEncoding(options)

    const stream = this.createWriteStream(fileName)
    return new Promise((resolve, reject) => {
      // unfortunately .end(..., cb) only forwards errors generated when
      // closing, not when writing the final chunk, so we also need to add
      // an error listener
      stream.on('error', err => reject(err))
      stream.end(data, encoding || 'utf8', err => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}

module.exports = Adapter
