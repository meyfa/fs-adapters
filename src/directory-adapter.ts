import stream from 'stream'
import path from 'path'
import fs from 'fs'

import { Adapter, ReadWriteOptions } from './adapter'
import { resolveEncoding } from './util/resolve-encoding'
import { getErrorCode } from './util/get-error-code'

export class DirectoryAdapter extends Adapter {
  readonly directory: string

  /**
   * Construct a new DirectoryAdapter.
   *
   * @param {string} directory The path to the directory.
   */
  constructor (directory: string) {
    super()
    this.directory = directory
  }

  private _resolve (fileName: string): string {
    if (path.isAbsolute(fileName)) {
      throw new Error('file name must be relative')
    }
    if (fileName.includes('/') || fileName.includes('\\')) {
      throw new Error('this adapter does not support file names containing slashes')
    }
    const abs = path.join(this.directory, fileName)
    const rel = path.relative(this.directory, abs)
    if (rel === '') {
      // denotes the base directory
      throw new Error('trying to access base directory')
    }
    if (rel.indexOf('..') === 0 || path.isAbsolute(rel)) {
      // navigates outside the base directory
      throw new Error('trying to navigate outside base directory')
    }
    return abs
  }

  override async init (): Promise<void> {
    try {
      await fs.promises.mkdir(this.directory)
      return // we can assume the directory was created
    } catch (err) {
      // ignore existing path ...
      if (getErrorCode(err) !== 'EEXIST') {
        throw err
      }
      // ... unless it is not a directory
      const stats = await fs.promises.lstat(this.directory)
      // (note: we definitely want to forward errors from lstat to the caller,
      // hence no second try-catch)
      if (!stats.isDirectory()) {
        throw new Error('expected base path to denote a directory')
      }
    }
  }

  override async listFiles (): Promise<string[]> {
    let files: string[] = []
    try {
      files = await fs.promises.readdir(this.directory)
    } catch (err) {
      // ignore missing directory
      if (getErrorCode(err) !== 'ENOENT') {
        throw err
      }
    }
    return files
  }

  override async exists (fileName: string): Promise<boolean> {
    const file = this._resolve(fileName)
    try {
      await fs.promises.access(file)
    } catch (err) {
      return false
    }
    return true
  }

  override async rename (fileName: string, newFileName: string): Promise<void> {
    const from = this._resolve(fileName)
    const to = this._resolve(newFileName)

    await fs.promises.rename(from, to)
  }

  override async delete (fileName: string): Promise<void> {
    const file = this._resolve(fileName)
    await fs.promises.unlink(file)
  }

  override createReadStream (fileName: string): stream.Readable {
    const file = this._resolve(fileName)
    return fs.createReadStream(file)
  }

  override createWriteStream (fileName: string): stream.Writable {
    const file = this._resolve(fileName)
    return fs.createWriteStream(file)
  }

  override async read (fileName: string, options?: ReadWriteOptions): Promise<Buffer | string> {
    const file = this._resolve(fileName)
    const encoding = resolveEncoding(options)
    return await fs.promises.readFile(file, { encoding })
  }

  override async write (fileName: string, data: Buffer | string, options?: ReadWriteOptions): Promise<void> {
    const file = this._resolve(fileName)
    const encoding = resolveEncoding(options)
    await fs.promises.writeFile(file, data, { encoding })
  }
}
