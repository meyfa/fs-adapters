'use strict'

const Adapter = require('./base')

const { ReadableStreamBuffer, WritableStreamBuffer } = require('stream-buffers')

/**
 * Add a collection of items to the given Map.
 *
 * The collection can be another Map, an array of Map-like entries,
 * or a plain object.
 *
 * @param {Map} map The destination Map.
 * @param {object | Map | Array[]} items The item collection.
 * @returns {void}
 */
function putAll (map, items) {
  if (typeof items !== 'object' || !items) return

  // convert to something that is iterable in [key, value] fashion
  const entries = items instanceof Map || Array.isArray(items)
    ? items
    : Object.entries(items)
  for (const [fileName, data] of entries) {
    map.set(fileName, Buffer.from(data))
  }
}

class MemoryAdapter extends Adapter {
  /**
   * Construct a new MemoryAdapter, optionally with a set of pre-existing files.
   *
   * The collection can be another Map, an array of Map-like entries,
   * or a plain object.
   *
   * @param {object | Map | Array[]} initialFiles Existing files.
   */
  constructor (initialFiles) {
    super()

    this.entries = new Map()
    putAll(this.entries, initialFiles)
  }

  _ensureValid (fileName) {
    // throw an error if the file name is not a somewhat reasonable string
    if (typeof fileName !== 'string' || !fileName.length) {
      throw new Error('expected fileName to be a non-empty string')
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
    this._ensureValid(fileName)
    return this.entries.has(fileName)
  }

  async rename (fileName, newFileName) {
    this._ensureExists(fileName)
    if (newFileName !== fileName) {
      this._ensureValid(newFileName)
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
    this._ensureValid(fileName)
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
    this._ensureValid(fileName)
    let buffer = data
    if (typeof data === 'string') {
      buffer = Buffer.from(data, (options && options.encoding) || 'utf8')
    }
    this.entries.set(fileName, buffer)
  }
}

module.exports = MemoryAdapter
