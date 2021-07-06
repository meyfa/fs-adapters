import stream from 'stream'
import { WritableStreamBuffer } from 'stream-buffers'
import { resolveEncoding } from './util/resolve-encoding'

export type ReadWriteOptions = BufferEncoding | { encoding: BufferEncoding } | { encoding?: null } | undefined | null

type OptionalEncoding = BufferEncoding | undefined | null
type BufferOrString<E extends OptionalEncoding> = E extends BufferEncoding ? string : Buffer

function getContentsFrom<E extends OptionalEncoding> (wsb: WritableStreamBuffer, encoding: E): BufferOrString<E>

/**
 * Returns the contents of a writable buffer.
 * If an encoding is specified, the contents are returned as a string, Buffer otherwise.
 *
 * @param {WritableStreamBuffer} wsb The writable buffer.
 * @param {?string} encoding The optional encoding.
 * @returns {Buffer|string} The contents as Buffer or decoded string.
 */
function getContentsFrom (wsb: WritableStreamBuffer, encoding: OptionalEncoding): Buffer | string {
  let result
  if (encoding != null) {
    result = wsb.getContentsAsString(encoding)
    if (result === false) return ''
  } else {
    result = wsb.getContents()
    if (result === false) return Buffer.alloc(0)
  }
  return result
}

export class Adapter {
  /**
   * Initialize this adapter.
   *
   * @returns {Promise} A Promise for when initialization is done.
   */
  async init (): Promise<void> {
    // do nothing
  }

  /**
   * Obtain a list of file names accessible through this adapter.
   *
   * @abstract
   * @returns {Promise<string[]>} A Promise that resolves to a file name array.
   */
  async listFiles (): Promise<string[]> {
    throw new Error('not implemented')
  }

  /**
   * Checks whether the given file name exists.
   *
   * @abstract
   * @param {string} fileName The name of the file to check.
   * @returns {Promise<boolean>} A promise returning whether or not this file exists.
   */
  async exists (fileName: string): Promise<boolean> {
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
  async rename (fileName: string, newFileName: string): Promise<void> {
    throw new Error('not implemented')
  }

  /**
   * Delete a file.
   *
   * @abstract
   * @param {string} fileName The name of the file to delete.
   * @returns {Promise} A Promise that resolves when done, or rejects on error.
   */
  async delete (fileName: string): Promise<void> {
    throw new Error('not implemented')
  }

  /**
   * Create a read-stream for the given file name.
   *
   * This should be preferred over read() when the file is potentially large or
   * does not need to be in memory all at once.
   *
   * @abstract
   * @param {string} fileName The name of the file to read.
   * @returns {object} A readable stream for the file.
   */
  createReadStream (fileName: string): stream.Readable {
    throw new Error('not implemented')
  }

  /**
   * Create a write-stream for the given file name.
   *
   * @abstract
   * @param {string} fileName The name of the file to write.
   * @returns {object} A writable stream for the file.
   */
  createWriteStream (fileName: string): stream.Writable {
    throw new Error('not implemented')
  }

  /**
   * Read the file whole, resolving to its contents as a Buffer.
   * If an encoding is specified, this will convert the buffer to a string and
   * resolve to that.
   *
   * @param {string} fileName The name of the file to read.
   * @param {?(object|string)} options Additional options: encoding.
   * @returns {Promise<Buffer|string>} Resolves to a Buffer or string, or rejects on error.
   */
  async read (fileName: string, options?: ReadWriteOptions): Promise<Buffer | string> {
    // DEFAULT IMPLEMENTATION
    // subclasses should override if they can provide better performance

    const encoding = resolveEncoding(options)

    const stream = this.createReadStream(fileName)
    const writable = new WritableStreamBuffer()
    const promise: Promise<Buffer | string> = new Promise((resolve, reject) => {
      // errors are not forwarded with pipe, so listen on original stream
      stream.on('error', err => reject(err))
      writable.on('finish', () => resolve(getContentsFrom(writable, encoding)))
    })
    stream.pipe(writable)
    return promise
  }

  /**
   * Write to the given file name.
   *
   * @param {string} fileName The name of the file to write.
   * @param {Buffer|string} data The data to write.
   * @param {?(object|string)} options Additional options: encoding.
   * @returns {Promise} Resolves when done, or rejects on error.
   */
  async write (fileName: string, data: Buffer | string, options?: ReadWriteOptions): Promise<void> {
    // DEFAULT IMPLEMENTATION
    // subclasses should override if they can provide better performance

    const encoding = resolveEncoding(options)

    const stream = this.createWriteStream(fileName)
    return await new Promise((resolve, reject) => {
      stream.on('error', err => reject(err))
      // The typings for stream.end do not specify an error parameter on the callback.
      // Yet, we sometimes see an error parameter given to that callback, with real stream implementations.
      // This happens specifically when they pass an error to the callback function of their _write method.
      // I think this is a bug with Node.js typings? Either way, handling the 'reject' case like this cannot hurt.
      const cb: () => void = (err?: any) => {
        if (err != null) reject(err)
        else resolve()
      }
      if (typeof data === 'string') {
        stream.end(data, encoding ?? 'utf8', cb)
      } else {
        stream.end(data, cb)
      }
    })
  }
}
