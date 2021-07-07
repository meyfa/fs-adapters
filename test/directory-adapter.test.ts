import path from 'path'
import fs from 'fs'
import rimraf from 'rimraf'

import { Adapter } from '../lib/adapter'
import { DirectoryAdapter } from '../lib/directory-adapter'

import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

const RESOURCES_DIR: string = path.join(__dirname, 'res')
const NON_EXISTENT_DIR: string = path.join(__dirname, 'res', 'noex')

describe('lib/directory-adapter.ts', function () {
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
    // helper function to avoid repeating ts-expect-error
    function callResolve (obj: DirectoryAdapter, ...args: any[]): any {
      // @ts-expect-error
      return obj._resolve(...args)
    }

    it('throws when resolving to base directory itself', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      expect(() => callResolve(obj, '')).to.throw()
      expect(() => callResolve(obj, '.')).to.throw()
      expect(() => callResolve(obj, './')).to.throw()
      expect(() => callResolve(obj, 'foo/..')).to.throw()
      expect(() => callResolve(obj, 'foo/../')).to.throw()
      expect(() => callResolve(obj, RESOURCES_DIR)).to.throw()
    })

    it('throws when resolving to parent directories', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      expect(() => callResolve(obj, '..')).to.throw()
      expect(() => callResolve(obj, '../../')).to.throw()
    })

    it('throws when resolving files outside base directory', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      expect(() => callResolve(obj, '../directory-adapter.test.ts')).to.throw()
      expect(() => callResolve(obj, 'foo/../../directory-adapter.test.ts')).to.throw()
    })

    it('throws when resolving absolute paths', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      expect(() => callResolve(obj, RESOURCES_DIR + '/foo.bin')).to.throw()
    })

    it('throws for paths containing a slash', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      expect(() => callResolve(obj, 'foo/bar/qux.bin')).to.throw()
    })
  })

  describe('#init()', function () {
    it('returns a Promise', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.init()).to.eventually.be.fulfilled
    })

    it('creates base directory if necessary', function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      return expect(obj.init()).to.eventually.be.fulfilled.then(() => {
        return expect(fs.promises.lstat(NON_EXISTENT_DIR)).to.eventually.be.fulfilled
          .and.satisfy((stats: fs.Stats) => stats.isDirectory())
      })
    })

    it('rejects if base path denotes a file', function () {
      const obj = new DirectoryAdapter(path.join(RESOURCES_DIR, 'test.txt'))
      return expect(obj.init()).to.eventually.be.rejected
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
        .with.members(['test.txt'])
    })

    it('rejects for base paths that are files', function () {
      const obj = new DirectoryAdapter(path.join(RESOURCES_DIR, 'test.txt'))
      return expect(obj.listFiles()).to.eventually.be.rejected
    })

    it('resolves to empty array for non-existent base directory', function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      return expect(obj.listFiles()).to.eventually.be.an('array')
        .that.is.empty
    })
  })

  describe('#exists()', function () {
    it('returns false for non-existent files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.exists('doesnotexist.txt')).to.eventually.equal(false)
    })

    it('returns false for non-existent base directory', function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      return expect(obj.exists('test.txt')).to.eventually.equal(false)
    })

    it('rejects when given nothing', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      // @ts-expect-error
      return expect(obj.exists()).to.eventually.be.rejected
    })

    it('returns true for existing files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.exists('test.txt')).to.eventually.equal(true)
    })
  })

  describe('#rename()', function () {
    it('rejects for missing files, with code=ENOENT', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.rename('doesnotexist.txt', 'bar.txt'))
        .to.eventually.be.rejected
        .with.property('code', 'ENOENT')
    })

    it('rejects for missing files even if renaming to same name', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.rename('doesnotexist.txt', 'doesnotexist.txt'))
        .to.eventually.be.rejected
        .with.property('code', 'ENOENT')
    })

    it('rejects for non-existent base directory, with code=ENOENT', function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      return expect(obj.rename('test.txt', 'bar.txt'))
        .to.eventually.be.rejected
        .with.property('code', 'ENOENT')
    })

    it('succeeds for existing files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.rename('test.txt', 'renamed.txt'))
        .to.eventually.be.fulfilled.then(() => {
          return expect(fs.promises.readdir(RESOURCES_DIR))
            .to.eventually.have.members(['renamed.txt'])
        })
    })

    it('rejects if source name not a string or is empty', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      // @ts-expect-error
      await expect(obj.rename(null, 'bar')).to.eventually.be.rejected
      await expect(obj.rename('', 'bar')).to.eventually.be.rejected
    })

    it('rejects if new name is not a string or is empty', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return await Promise.all([
        // @ts-expect-error
        expect(obj.rename('test.txt', null)).to.eventually.be.rejected,
        expect(obj.rename('test.txt', '')).to.eventually.be.rejected
      ])
    })
  })

  describe('#delete()', function () {
    it('rejects for missing files, with code=ENOENT', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.delete('doesnotexist.txt'))
        .to.eventually.be.rejected
        .with.property('code', 'ENOENT')
    })

    it('rejects for non-existent base directory, with code=ENOENT', function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      return expect(obj.delete('test.txt'))
        .to.eventually.be.rejected
        .with.property('code', 'ENOENT')
    })

    it('succeeds for existing files', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.delete('test.txt'))
        .to.eventually.be.fulfilled.then(() => {
          return expect(fs.promises.readdir(RESOURCES_DIR)).to.eventually.be.empty
        })
    })
  })

  describe('#createReadStream()', function () {
    it('obtains a stream that errors for missing files, with code=ENOENT', function (done) {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createReadStream('doesnotexist.txt')
      expect(stream).to.be.an('object')
      stream.on('error', err => {
        expect(err).to.be.an('error').with.property('code', 'ENOENT')
        done()
      })
    })

    it('obtains a stream that errors for non-existent base directory, with code=ENOENT', function (done) {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      const stream = obj.createReadStream('test.txt')
      expect(stream).to.be.an('object')
      stream.on('error', err => {
        expect(err).to.be.an('error').with.property('code', 'ENOENT')
        done()
      })
    })

    it('obtains readable streams for existing files', function (done) {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createReadStream('test.txt')
      expect(stream)
        .to.be.an('object')
        .with.property('read').that.is.a('function')
      stream.on('close', done)
      stream.destroy()
    })

    it('allows reading data', function (done) {
      const expected = Buffer.from('hello world', 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createReadStream('test.txt')
      stream.on('data', function (chunk) {
        expect(chunk).to.satisfy((c: Buffer) => expected.equals(c))
        stream.on('close', done)
        stream.destroy()
      })
    })
  })

  describe('#createWriteStream()', function () {
    it('returns writable streams', function (done) {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createWriteStream('foo.bin')
      expect(stream)
        .to.be.an('object')
        .with.property('write').that.is.a('function')
      stream.on('close', done)
      stream.destroy()
    })

    it('allows writing data', function (done) {
      const data = Buffer.from(`t${Date.now()}`, 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createWriteStream('foo.bin')
      stream.on('finish', function () {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        expect(writtenData).to.satisfy((c: Buffer) => data.equals(c))
        stream.on('close', done)
      })
      stream.end(data)
    })

    it('throws if name is not a string or is empty', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      // @ts-expect-error
      expect(() => obj.createWriteStream(null)).to.throw()
      expect(() => obj.createWriteStream('')).to.throw()
    })
  })

  describe('#read()', function () {
    it('rejects for missing files, with code=ENOENT', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.read('doesnotexist.txt')).to.eventually.be.rejected
        .with.property('code', 'ENOENT')
    })

    it('rejects for non-existent base directory, with code=ENOENT', function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      return expect(obj.read('test.txt')).to.eventually.be.rejected
        .with.property('code', 'ENOENT')
    })

    it('reads existing files', function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.read('test.txt'))
        .to.eventually.satisfy((d: Buffer) => data.equals(d))
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
        .to.eventually.satisfy((d: Buffer) => data.equals(d))
    })

    it('treats string options as encoding', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.read('test.txt', 'utf8'))
        .to.eventually.equal('hello world')
    })
  })

  describe('#write()', function () {
    it('writes data', function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.write('foo.bin', data)).to.eventually.be.fulfilled.then(() => {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        return expect(writtenData).to.satisfy((c: Buffer) => data.equals(c))
      })
    })

    it('rejects if name is not a string or is empty', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return await Promise.all([
        // @ts-expect-error
        expect(obj.write(null, Buffer.alloc(0))).to.eventually.be.rejected,
        expect(obj.write('', Buffer.alloc(0))).to.eventually.be.rejected
      ])
    })

    it('supports encodings for strings: no options', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.write('foo.bin', 'hello world')).to.eventually.be.fulfilled.then(() => {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        const expected = Buffer.from('hello world', 'utf8')
        return expect(writtenData).to.satisfy((c: Buffer) => expected.equals(c))
      })
    })

    it('supports encodings for strings: empty options', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.write('foo.bin', 'hello world', {})).to.eventually.be.fulfilled.then(() => {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        const expected = Buffer.from('hello world', 'utf8')
        return expect(writtenData).to.satisfy((c: Buffer) => expected.equals(c))
      })
    })

    it('supports encodings for strings: explicit encoding option', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.write('foo.bin', 'hello world', { encoding: 'utf16le' })).to.eventually.be.fulfilled.then(() => {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        const expected = Buffer.from('hello world', 'utf16le')
        return expect(writtenData).to.satisfy((c: Buffer) => expected.equals(c))
      })
    })

    it('supports encodings for strings: string parameter', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      return expect(obj.write('foo.bin', 'hello world', 'utf16le')).to.eventually.be.fulfilled.then(() => {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        const expected = Buffer.from('hello world', 'utf16le')
        return expect(writtenData).to.satisfy((c: Buffer) => expected.equals(c))
      })
    })
  })
})
