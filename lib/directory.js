'use strict'

const Adapter = require('./base')

const path = require('path')
const fs = require('fs')

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
    } catch (err) {
      // ignore existing directory
      if (err.code !== 'EEXIST') {
        throw err
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

  async read (fileName) {
    const file = this._resolve(fileName)
    return fs.promises.readFile(file)
  }

  async write (fileName, data) {
    const file = this._resolve(fileName)
    await fs.promises.writeFile(file, data)
  }
}

module.exports = DirectoryAdapter
