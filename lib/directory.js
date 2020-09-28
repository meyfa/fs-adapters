'use strict'

const Adapter = require('./base')

const path = require('path')
const fs = require('fs')
const resolveEncoding = require('./util/resolve-encoding')

class DirectoryAdapter extends Adapter {
  /**
   * Construct a new DirectoryAdapter.
   *
   * @param {string} directory The path to the directory.
   */
  constructor (directory) {
    super()
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

  async init () {
    try {
      await fs.promises.mkdir(this.directory)
      return // we can assume the directory was created
    } catch (err) {
      // ignore existing path ...
      if (err.code !== 'EEXIST') {
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

  async exists (fileName) {
    const file = this._resolve(fileName)
    try {
      await fs.promises.access(file)
    } catch (err) {
      return false
    }
    return true
  }

  async rename (fileName, newFileName) {
    const from = this._resolve(fileName)
    const to = this._resolve(newFileName)

    await fs.promises.rename(from, to)
  }

  async delete (fileName) {
    const file = this._resolve(fileName)
    await fs.promises.unlink(file)
  }

  createReadStream (fileName) {
    const file = this._resolve(fileName)
    return fs.createReadStream(file)
  }

  createWriteStream (fileName) {
    const file = this._resolve(fileName)
    return fs.createWriteStream(file)
  }

  async read (fileName, options) {
    const file = this._resolve(fileName)
    const encoding = resolveEncoding(options)
    return fs.promises.readFile(file, {
      encoding: encoding || null
    })
  }

  async write (fileName, data, options) {
    const file = this._resolve(fileName)
    const encoding = resolveEncoding(options)
    await fs.promises.writeFile(file, data, {
      encoding: encoding || undefined
    })
  }
}

module.exports = DirectoryAdapter
