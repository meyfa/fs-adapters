'use strict'

const chai = require('chai')
chai.use(require('chai-as-promised'))
const expect = chai.expect

const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')

const RESOURCES_DIR = path.join(__dirname, 'res')

const Adapter = require('../lib/base.js')
const DirectoryAdapter = require('../lib/directory.js')

describe('lib/directory.js', function () {
  beforeEach(function () {
    rimraf.sync(RESOURCES_DIR)
    fs.mkdirSync(RESOURCES_DIR)
    fs.writeFileSync(path.join(RESOURCES_DIR, 'test.txt'), 'hello world')
  })

  after(function () {
    rimraf.sync(RESOURCES_DIR)
  })

  it('extends Adapter', function () {
    expect(DirectoryAdapter.prototype).to.be.instanceOf(Adapter)
  })

  describe('#_resolve()', function () {
    it('throws when resolving to base directory itself', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      expect(() => obj._resolve('')).to.throw()
      expect(() => obj._resolve('.')).to.throw()
      expect(() => obj._resolve('./')).to.throw()
      expect(() => obj._resolve('foo/..')).to.throw()
      expect(() => obj._resolve('foo/../')).to.throw()
      expect(() => obj._resolve(RESOURCES_DIR)).to.throw()
    })

    it('throws when resolving to parent directories', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      expect(() => obj._resolve('..')).to.throw()
      expect(() => obj._resolve('../../')).to.throw()
    })

    it('throws when resolving files outside base directory', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      expect(() => obj._resolve('../directory.test.js')).to.throw()
      expect(() => obj._resolve('foo/../../directory.test.js')).to.throw()
    })

    it('throws when resolving absolute paths', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      expect(() => obj._resolve(RESOURCES_DIR + '/foo.bin')).to.throw()
    })
  })

  describe('#init()', function () {
    it('returns a Promise', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.init()).to.eventually.be.fulfilled
    })
  })

  describe('#listFiles()', function () {
    it('resolves to an array', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.listFiles()).to.eventually.be.an('array')
    })

    it('includes existing files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.listFiles()).to.eventually.be.an('array')
        .that.includes('test.txt')
    })

    it('rejects for base paths that are files', function () {
      const obj = new DirectoryAdapter(path.join(RESOURCES_DIR, 'test.txt'))
      return expect(obj.listFiles()).to.eventually.be.rejected
    })

    it('resolves to empty array for non-existent base directory', function () {
      const obj = new DirectoryAdapter(path.join(RESOURCES_DIR, 'subdir'))
      return expect(obj.listFiles()).to.eventually.be.an('array')
        .that.is.empty
    })
  })

  describe('#exists()', function () {
    it('returns false for non-existent files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.exists('doesnotexist.txt')).to.eventually.equal(false)
    })

    it('returns true for existing files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.exists('test.txt')).to.eventually.equal(true)
    })

    it('rejects when given nothing', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.exists()).to.eventually.be.rejected
    })
  })

  describe('#rename()', function () {
    it('rejects for missing files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.rename('doesnotexist.txt', 'bar.txt'))
        .to.eventually.be.rejected
    })

    it('succeeds for existing files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.rename('test.txt', 'test.txt'))
        .to.eventually.be.fulfilled
    })
  })

  describe('#delete()', function () {
    it('rejects for missing files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.delete('doesnotexist.txt'))
        .to.eventually.be.rejected
    })

    it('succeeds for existing files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.delete('test.txt'))
        .to.eventually.be.fulfilled
    })
  })

  describe('#createReadStream()', function () {
    it('obtains a stream that errors for missing files', function (done) {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createReadStream('doesnotexist.txt')
      expect(stream).to.be.an('object')
      stream.on('error', err => {
        expect(err).to.be.an('error').with.property('code', 'ENOENT')
        done()
      })
    })

    it('obtains readable streams for existing files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createReadStream('test.txt')
      expect(stream)
        .to.be.an('object')
        .with.property('read').that.is.a('function')
      stream.destroy()
    })

    it('reads data', function (done) {
      const expected = Buffer.from('hello world', 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createReadStream('test.txt')
      stream.on('data', function (chunk) {
        expect(chunk).to.satisfy((c) => expected.equals(c))
        stream.destroy()
        done()
      })
    })
  })

  describe('#createWriteStream()', function () {
    it('returns writable streams', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createWriteStream('foo.bin')
      expect(stream)
        .to.be.an('object')
        .with.property('write').that.is.a('function')
      stream.destroy()
    })

    it('writes data', function (done) {
      const data = Buffer.from('t' + Date.now(), 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createWriteStream('foo.bin')
      stream.on('finish', function () {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        expect(writtenData).to.satisfy((c) => data.equals(c))
        done()
      })
      stream.end(data)
    })
  })

  describe('#read()', function () {
    it('rejects for missing files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.read('doesnotexist.txt')).to.eventually.be.rejected
    })

    it('reads existing files', function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.read('test.txt'))
        .to.eventually.satisfy(d => data.equals(d))
    })

    it('converts to string if passed an encoding', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.read('test.txt', { encoding: 'utf8' }))
        .to.eventually.equal('hello world')
    })

    it('ignores empty options', function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.read('test.txt', {}))
        .to.eventually.satisfy(d => data.equals(d))
    })
  })

  describe('#write()', function () {
    it('writes data', function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.write('foo.bin', data)).to.eventually.be.fulfilled.then(() => {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        return expect(writtenData).to.satisfy((c) => data.equals(c))
      })
    })

    it('supports encodings for strings: no options', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.write('foo.bin', 'hello world')).to.eventually.be.fulfilled.then(() => {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        const expected = Buffer.from('hello world', 'utf8')
        return expect(writtenData).to.satisfy((c) => expected.equals(c))
      })
    })

    it('supports encodings for strings: empty options', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.write('foo.bin', 'hello world', {})).to.eventually.be.fulfilled.then(() => {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        const expected = Buffer.from('hello world', 'utf8')
        return expect(writtenData).to.satisfy((c) => expected.equals(c))
      })
    })

    it('supports encodings for strings: explicit encoding option', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.write('foo.bin', 'hello world', { encoding: 'utf16le' })).to.eventually.be.fulfilled.then(() => {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        const expected = Buffer.from('hello world', 'utf16le')
        return expect(writtenData).to.satisfy((c) => expected.equals(c))
      })
    })
  })
})
