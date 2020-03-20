'use strict'

const Promise = require('bluebird')

const streamBuffers = require('stream-buffers')
const ReadableStreamBuffer = streamBuffers.ReadableStreamBuffer
const WritableStreamBuffer = streamBuffers.WritableStreamBuffer

class MemoryAdapter {
  /**
   * Construct a new MemoryAdapter.
   *
   * @param {object.<string, Buffer>} initialFiles The files already in this virtual directory.
   */
  constructor (initialFiles) {
    this.entries = new Map()

    // load initial file buffers
    if (typeof initialFiles === 'object' && initialFiles) {
      Object.keys(initialFiles).forEach((fileName) => {
        const buf = Buffer.from(initialFiles[fileName])
        this.entries.set(fileName, buf)
      })
    }
  }

  _ensureExists (fileName) {
    // throw ENOENT when file not found
    if (!this.entries.has(fileName)) {
      const err = new Error()
      err.code = 'ENOENT'
      throw err
    }
  }

  /**
   * Initialize this adapter.
   *
   * @returns {Promise} A Promise for when initialization is done.
   */
  init () {
    // do nothing
    return Promise.resolve()
  }

  /**
   * Obtain a list of file names accessible through this adapter.
   *
   * @returns {Promise<string[]>} A Promise that resolves to a file name array.
   */
  listFiles () {
    return Promise.resolve(Array.from(this.entries.keys()))
  }

  /**
   * Checks whether the given file name exists.
   *
   * @param {string} fileName The name of the file to check.
   * @returns {Promise<boolean>} A promise returning whether or not this file exists.
   */
  exists (fileName) {
    return Promise.resolve(this.entries.has(fileName))
  }

  /**
   * Create a read stream for the given file name.
   *
   * @param {string} fileName The name of the file to read.
   * @returns {object} A readable stream for the file.
   */
  createReadStream (fileName) {
    this._ensureExists(fileName)

    const stream = new ReadableStreamBuffer()
    stream.put(this.entries.get(fileName))
    stream.stop()

    return stream
  }

  /**
   * Create a write stream for the given file name.
   *
   * @param {string} fileName The name of the file to write.
   * @returns {object} A writable stream for the file.
   */
  createWriteStream (fileName) {
    const stream = new WritableStreamBuffer()
    stream.on('finish', () => {
      this.entries.set(fileName, stream.getContents())
    })
    return stream
  }

  /**
   * Rename a file.
   *
   * @param {string} fileName The old file name.
   * @param {string} newFileName The new file name.
   * @returns {Promise} A Promise that resolves when done, or rejects on error.
   */
  rename (fileName, newFileName) {
    return new Promise((resolve) => {
      this._ensureExists(fileName)
      this.entries.set(newFileName, this.entries.get(fileName))
      this.entries.delete(fileName)

      resolve()
    })
  }

  /**
   * Delete a file.
   *
   * @param {string} fileName The name of the file to delete.
   * @returns {Promise} A Promise that resolves when done, or rejects on error.
   */
  delete (fileName) {
    return new Promise((resolve) => {
      this._ensureExists(fileName)
      this.entries.delete(fileName)

      resolve()
    })
  }
}

module.exports = MemoryAdapter
