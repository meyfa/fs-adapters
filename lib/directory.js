'use strict'

const path = require('path')
const fs = require('fs')

class DirectoryAdapter {
  /**
   * Construct a new DirectoryAdapter.
   *
   * @param {string} directory The path to the directory.
   */
  constructor (directory) {
    this.directory = directory
  }

  _resolve (fileName) {
    if (path.isAbsolute(fileName)) {
      throw new Error('file name must be relative')
    }
    const abs = path.join(this.directory, fileName)
    const rel = path.relative(this.directory, abs)
    if (!rel) {
      // denotes the base directory
      throw new Error('trying to access base directory')
    }
    if (rel.indexOf('..') === 0 || path.isAbsolute(rel)) {
      // navigates outside the base directory
      throw new Error('trying to navigate outside base directory')
    }
    return abs
  }

  /**
   * Initialize this adapter.
   *
   * @returns {Promise} A Promise for when initialization is done.
   */
  async init () {
    try {
      await fs.promises.mkdir(this.directory)
    } catch (err) {
      // ignore existing directory
      if (err.code !== 'EEXIST') {
        throw err
      }
    }
  }

  /**
   * Obtain a list of file names accessible through this adapter.
   *
   * @returns {Promise<string[]>} A Promise that resolves to a file name array.
   */
  async listFiles () {
    let files = []
    try {
      files = await fs.promises.readdir(this.directory)
    } catch (err) {
      // ignore missing directory
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
    return files
  }

  /**
   * Checks whether the given file name exists.
   *
   * @param {string} fileName The name of the file to check.
   * @returns {Promise<boolean>} A promise returning whether or not this file exists.
   */
  async exists (fileName) {
    const file = this._resolve(fileName)
    try {
      await fs.promises.access(file)
    } catch (err) {
      return false
    }
    return true
  }

  /**
   * Create a read stream for the given file name.
   *
   * @param {string} fileName The name of the file to read.
   * @returns {object} A readable stream for the file.
   */
  createReadStream (fileName) {
    const file = this._resolve(fileName)
    return fs.createReadStream(file)
  }

  /**
   * Create a write stream for the given file name.
   *
   * @param {string} fileName The name of the file to write.
   * @returns {object} A writable stream for the file.
   */
  createWriteStream (fileName) {
    const file = this._resolve(fileName)
    return fs.createWriteStream(file)
  }

  /**
   * Rename a file.
   *
   * @param {string} fileName The old file name.
   * @param {string} newFileName The new file name.
   * @returns {Promise} A Promise that resolves when done, or rejects on error.
   */
  async rename (fileName, newFileName) {
    const from = this._resolve(fileName)
    const to = this._resolve(newFileName)

    await fs.promises.rename(from, to)
  }

  /**
   * Delete a file.
   *
   * @param {string} fileName The name of the file to delete.
   * @returns {Promise} A Promise that resolves when done, or rejects on error.
   */
  async delete (fileName) {
    const file = this._resolve(fileName)
    await fs.promises.unlink(file)
  }
}

module.exports = DirectoryAdapter
