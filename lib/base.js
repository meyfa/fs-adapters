'use strict'

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
}

module.exports = Adapter
