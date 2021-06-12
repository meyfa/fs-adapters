import stream from 'stream'
import { ReadableStreamBuffer, WritableStreamBuffer } from 'stream-buffers'

import Adapter, { ReadWriteOptions } from './base'
import resolveEncoding from './util/resolve-encoding'

type FileContents = Buffer | string
type FileContentsMapping = Record<string, FileContents> | Map<string, FileContents> | Array<[string, FileContents]>

type ErrorCode = 'ENOENT'

class ErrorWithCode extends Error {
  readonly code: ErrorCode

  constructor (code: ErrorCode) {
    super()
    this.code = code
  }
}

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
function putAll (map: Map<string, Buffer>, items?: FileContentsMapping): void {
  if (typeof items !== 'object' || items == null) return

  // convert to something that is iterable in [key, value] fashion
  const entries = items instanceof Map || Array.isArray(items)
    ? items
    : Object.entries(items)
  for (const [fileName, data] of entries) {
    map.set(fileName, Buffer.from(data))
  }
}

export default class MemoryAdapter extends Adapter {
  private readonly entries: Map<string, Buffer>

  /**
   * Construct a new MemoryAdapter, optionally with a set of pre-existing files.
   *
   * The collection can be another Map, an array of Map-like entries,
   * or a plain object.
   *
   * @param {object | Map | Array[]} initialFiles Existing files.
   */
  constructor (initialFiles?: FileContentsMapping) {
    super()

    this.entries = new Map()
    putAll(this.entries, initialFiles)
  }

  _ensureValid (fileName: any): void {
    // throw an error if the file name is not a somewhat reasonable string
    if (typeof fileName !== 'string' || fileName.length <= 0) {
      throw new Error('expected fileName to be a non-empty string')
    }
  }

  _ensureExists (fileName: string): void {
    // throw ENOENT when file not found
    if (!this.entries.has(fileName)) {
      throw new ErrorWithCode('ENOENT')
    }
  }

  _safeGet (fileName: string): Buffer {
    const value: Buffer | undefined = this.entries.get(fileName)
    if (value == null) {
      throw new ErrorWithCode('ENOENT')
    }
    return value
  }

  async listFiles (): Promise<string[]> {
    return Array.from(this.entries.keys())
  }

  async exists (fileName: string): Promise<boolean> {
    this._ensureValid(fileName)
    return this.entries.has(fileName)
  }

  async rename (fileName: string, newFileName: string): Promise<void> {
    if (newFileName !== fileName) {
      this._ensureValid(newFileName)
      this.entries.set(newFileName, this._safeGet(fileName))
      this.entries.delete(fileName)
    }
  }

  async delete (fileName: string): Promise<void> {
    this._ensureExists(fileName)
    this.entries.delete(fileName)
  }

  createReadStream (fileName: string): stream.Readable {
    const data = this._safeGet(fileName)

    const stream = new ReadableStreamBuffer()
    stream.put(data)
    stream.stop()

    return stream
  }

  createWriteStream (fileName: string): stream.Writable {
    this._ensureValid(fileName)
    const stream = new WritableStreamBuffer()
    stream.on('finish', () => {
      const data: Buffer | false = stream.getContents()
      this.entries.set(fileName, data === false ? Buffer.alloc(0) : data)
    })
    return stream
  }

  async read (fileName: string, options?: ReadWriteOptions): Promise<Buffer | string> {
    const encoding = resolveEncoding(options)
    const buffer = this._safeGet(fileName)
    return encoding != null ? buffer.toString(encoding) : buffer
  }

  async write (fileName: string, data: Buffer | string, options?: ReadWriteOptions): Promise<void> {
    this._ensureValid(fileName)
    const encoding = resolveEncoding(options)
    const buffer = typeof data === 'string'
      ? Buffer.from(data, encoding ?? 'utf8')
      : data
    this.entries.set(fileName, buffer)
  }
}
