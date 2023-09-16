import stream from 'node:stream'
import { ReadableStreamBuffer, WritableStreamBuffer } from 'stream-buffers'

import { Adapter, ReadWriteOptions } from './adapter.js'
import { resolveEncoding } from './util/resolve-encoding.js'

type FileContents = Buffer | string
type FileContentsMapping = Record<string, FileContents> | Map<string, FileContents> | Array<[string, FileContents]>

/**
 * Add a collection of items to the given Map.
 *
 * The collection can be another Map, an array of Map-like entries,
 * or a plain object.
 * @param map The destination Map.
 * @param items The item collection.
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

export class MemoryAdapter extends Adapter {
  private readonly entries: Map<string, Buffer>

  /**
   * Construct a new MemoryAdapter, optionally with a set of pre-existing files.
   *
   * The collection can be another Map, an array of Map-like entries,
   * or a plain object.
   * @param initialFiles Existing files.
   */
  constructor (initialFiles?: FileContentsMapping) {
    super()

    this.entries = new Map()
    putAll(this.entries, initialFiles)
  }

  private static _ensureValid (fileName: any): void {
    // throw an error if the file name is not a somewhat reasonable string
    if (typeof fileName !== 'string' || fileName.length <= 0) {
      throw new Error('expected fileName to be a non-empty string')
    }
  }

  private _ensureExists (fileName: string): void {
    // throw ENOENT when file not found
    if (!this.entries.has(fileName)) {
      throw Object.assign(new Error(), { code: 'ENOENT' })
    }
  }

  private _safeGet (fileName: string): Buffer {
    const value: Buffer | undefined = this.entries.get(fileName)
    if (value == null) {
      throw Object.assign(new Error(), { code: 'ENOENT' })
    }
    return value
  }

  override async listFiles (): Promise<string[]> {
    return Array.from(this.entries.keys())
  }

  override async exists (fileName: string): Promise<boolean> {
    MemoryAdapter._ensureValid(fileName)
    return this.entries.has(fileName)
  }

  override async rename (fileName: string, newFileName: string): Promise<void> {
    const source = this._safeGet(fileName)
    if (newFileName !== fileName) {
      MemoryAdapter._ensureValid(newFileName)
      this.entries.set(newFileName, source)
      this.entries.delete(fileName)
    }
  }

  override async delete (fileName: string): Promise<void> {
    this._ensureExists(fileName)
    this.entries.delete(fileName)
  }

  override createReadStream (fileName: string): stream.Readable {
    const data = this._safeGet(fileName)

    const stream = new ReadableStreamBuffer()
    stream.put(data)
    stream.stop()

    return stream
  }

  override createWriteStream (fileName: string): stream.Writable {
    MemoryAdapter._ensureValid(fileName)
    const stream = new WritableStreamBuffer()
    stream.on('finish', () => {
      const data: Buffer | false = stream.getContents()
      this.entries.set(fileName, data === false ? Buffer.alloc(0) : data)
    })
    return stream
  }

  override async read (fileName: string, options?: ReadWriteOptions): Promise<Buffer | string> {
    const encoding = resolveEncoding(options)
    const buffer = this._safeGet(fileName)
    return encoding != null ? buffer.toString(encoding) : buffer
  }

  override async write (fileName: string, data: Buffer | string, options?: ReadWriteOptions): Promise<void> {
    MemoryAdapter._ensureValid(fileName)
    const encoding = resolveEncoding(options)
    const buffer = typeof data === 'string'
      ? Buffer.from(data, encoding ?? 'utf8')
      : data
    this.entries.set(fileName, buffer)
  }
}
