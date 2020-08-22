'use strict'

const Adapter = require('./base')

const { ReadableStreamBuffer, WritableStreamBuffer } = require('stream-buffers')

class MemoryAdapter extends Adapter {
  /**
   * Construct a new MemoryAdapter.
   *
   * @param {object.<string, Buffer>} initialFiles The files already in this virtual directory.
   */
  constructor (initialFiles) {
    super()
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

  async listFiles () {
    return Array.from(this.entries.keys())
  }

  async exists (fileName) {
    return this.entries.has(fileName)
  }

  createReadStream (fileName) {
    this._ensureExists(fileName)

    const stream = new ReadableStreamBuffer()
    stream.put(this.entries.get(fileName))
    stream.stop()

    return stream
  }

  createWriteStream (fileName) {
    const stream = new WritableStreamBuffer()
    stream.on('finish', () => {
      this.entries.set(fileName, stream.getContents())
    })
    return stream
  }

  async rename (fileName, newFileName) {
    this._ensureExists(fileName)
    if (newFileName !== fileName) {
      this.entries.set(newFileName, this.entries.get(fileName))
      this.entries.delete(fileName)
    }
  }

  async delete (fileName) {
    this._ensureExists(fileName)
    this.entries.delete(fileName)
  }
}

module.exports = MemoryAdapter
