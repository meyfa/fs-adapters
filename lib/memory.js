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

  async read (fileName, options) {
    this._ensureExists(fileName)
    const buffer = this.entries.get(fileName)
    if (options && options.encoding) {
      return buffer.toString(options.encoding)
    }
    return buffer
  }

  async write (fileName, data, options) {
    let buffer = data
    if (typeof data === 'string') {
      buffer = Buffer.from(data, (options && options.encoding) || 'utf8')
    }
    this.entries.set(fileName, buffer)
  }
}

module.exports = MemoryAdapter
