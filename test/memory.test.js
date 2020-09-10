'use strict'

const chai = require('chai')
chai.use(require('chai-as-promised'))
const expect = chai.expect

const Adapter = require('../lib/base.js')
const MemoryAdapter = require('../lib/memory.js')

describe('lib/memory.js', function () {
  it('extends Adapter', function () {
    expect(MemoryAdapter.prototype).to.be.instanceOf(Adapter)
  })

  describe('#init()', function () {
    it('returns a Promise', function () {
      const obj = new MemoryAdapter()
      return expect(obj.init()).to.eventually.be.fulfilled
    })
  })

  describe('#listFiles()', function () {
    it('resolves to an array', function () {
      const obj = new MemoryAdapter()
      return expect(obj.listFiles()).to.eventually.be.an('array')
    })

    it('includes initial files', function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0),
        'bar.tmp': Buffer.alloc(0),
        baz: Buffer.alloc(0)
      })
      return expect(obj.listFiles()).to.eventually.be.an('array')
        .with.members(['foo', 'bar.tmp', 'baz'])
    })
  })

  describe('#exists()', function () {
    it('returns false for missing files', function () {
      const obj = new MemoryAdapter()
      return expect(obj.exists('foo')).to.eventually.equal(false)
    })

    it('rejects when given nothing', function () {
      const obj = new MemoryAdapter()
      return expect(obj.exists()).to.eventually.be.rejected
    })

    it('returns true for existing files', function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      return expect(obj.exists('foo')).to.eventually.equal(true)
    })
  })

  describe('#rename()', function () {
    it('rejects for missing files, with code=ENOENT', function () {
      const obj = new MemoryAdapter()
      return expect(obj.rename('foo', 'bar')).to.eventually.be.rejected
        .with.property('code', 'ENOENT')
    })

    it('renames files', function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      return obj.rename('foo', 'bar').then(() => {
        return expect(obj.listFiles())
          .to.eventually.include('bar').but.not.include('foo')
      })
    })

    it('keeps contents', function (done) {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter({
        foo: data
      })
      obj.rename('foo', 'bar').then(() => {
        const read = obj.createReadStream('bar')
        read.on('data', function (chunk) {
          expect(chunk).to.satisfy((c) => data.equals(c))
          done()
        })
      })
    })

    it('does nothing if name stays the same', function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      return obj.rename('foo', 'foo').then(() => {
        return expect(obj.listFiles())
          .to.eventually.deep.equal(['foo'])
      })
    })

    it('rejects if new name is not a string or is empty', function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      return Promise.all([
        expect(obj.rename('foo', null)).to.eventually.be.rejected,
        expect(obj.rename('foo', '')).to.eventually.be.rejected
      ])
    })
  })

  describe('#delete()', function () {
    it('rejects for missing files, with code=ENOENT', function () {
      const obj = new MemoryAdapter()
      return expect(obj.delete('foo')).to.eventually.be.rejected
        .with.property('code', 'ENOENT')
    })

    it('deletes files', function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      return obj.delete('foo').then(() => {
        return expect(obj.listFiles()).to.eventually.not.include('foo')
      })
    })
  })

  describe('#createReadStream()', function () {
    it('throws for missing files, with code=ENOENT', function () {
      const obj = new MemoryAdapter()
      return expect(() => obj.createReadStream('foo')).to.throw()
        .with.property('code', 'ENOENT')
    })

    it('obtains readable streams for existing files', function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      return expect(obj.createReadStream('foo'))
        .to.be.an('object')
        .with.property('read').that.is.a('function')
    })

    it('allows reading data', function (done) {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter({
        foo: data
      })
      const stream = obj.createReadStream('foo')
      stream.on('data', function (chunk) {
        expect(chunk).to.satisfy((c) => data.equals(c))
        done()
      })
    })
  })

  describe('#createWriteStream()', function () {
    it('returns writable streams', function () {
      const obj = new MemoryAdapter()
      return expect(obj.createWriteStream('foo'))
        .to.be.an('object')
        .with.property('write').that.is.a('function')
    })

    it('allows writing data', function (done) {
      const obj = new MemoryAdapter()
      const stream = obj.createWriteStream('foo')
      stream.on('finish', function () {
        const read = obj.createReadStream('foo')
        read.on('data', function (chunk) {
          const expected = Buffer.from('hello world', 'utf8')
          expect(chunk).to.satisfy((c) => expected.equals(c))
          done()
        })
      })
      stream.end('hello world', 'utf8')
    })

    it('adds to the list of files', function (done) {
      const obj = new MemoryAdapter()
      const stream = obj.createWriteStream('foo')
      stream.on('finish', function () {
        expect(obj.listFiles()).to.eventually.be.an('array')
          .with.members(['foo'])
          .notify(done)
      })
      stream.end()
    })

    it('throws if name is not a string or is empty', function () {
      const obj = new MemoryAdapter()
      expect(() => obj.createWriteStream(null)).to.throw()
      expect(() => obj.createWriteStream('')).to.throw()
    })
  })

  describe('#read()', function () {
    it('rejects for missing files, with code=ENOENT', function () {
      const obj = new MemoryAdapter()
      return expect(obj.read('foo')).to.eventually.be.rejected
        .with.property('code', 'ENOENT')
    })

    it('reads existing files', function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter({
        foo: data
      })
      return expect(obj.read('foo')).to.eventually.satisfy(d => data.equals(d))
    })

    it('converts to string if passed an encoding', function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter({
        foo: data
      })
      return expect(obj.read('foo', { encoding: 'utf8' }))
        .to.eventually.equal('hello world')
    })

    it('ignores empty options', function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter({
        foo: data
      })
      return expect(obj.read('foo', {})).to.eventually.satisfy(d => data.equals(d))
    })
  })

  describe('#write()', function () {
    it('writes data', function (done) {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter()
      expect(obj.write('foo', data)).to.eventually.be.fulfilled.then(() => {
        const read = obj.createReadStream('foo')
        read.on('data', function (chunk) {
          expect(chunk).to.satisfy((c) => data.equals(c))
          done()
        })
      })
    })

    it('adds to the list of files', function () {
      const obj = new MemoryAdapter()
      return obj.write('foo', Buffer.alloc(0)).then(() => {
        return expect(obj.listFiles()).to.eventually.be.an('array')
          .with.members(['foo'])
      })
    })

    it('rejects if name is not a string or is empty', function () {
      const obj = new MemoryAdapter()
      return Promise.all([
        expect(obj.write(null, Buffer.alloc(0))).to.eventually.be.rejected,
        expect(obj.write('', Buffer.alloc(0))).to.eventually.be.rejected
      ])
    })

    it('supports encodings for strings: no options', function (done) {
      const obj = new MemoryAdapter()
      expect(obj.write('foo', 'hello world')).to.eventually.be.fulfilled.then(() => {
        const read = obj.createReadStream('foo')
        read.on('data', function (chunk) {
          const expected = Buffer.from('hello world', 'utf8')
          expect(chunk).to.satisfy((c) => expected.equals(c))
          done()
        })
      })
    })

    it('supports encodings for strings: empty options', function (done) {
      const obj = new MemoryAdapter()
      expect(obj.write('foo', 'hello world', {})).to.eventually.be.fulfilled.then(() => {
        const read = obj.createReadStream('foo')
        read.on('data', function (chunk) {
          const expected = Buffer.from('hello world', 'utf8')
          expect(chunk).to.satisfy((c) => expected.equals(c))
          done()
        })
      })
    })

    it('supports encodings for strings: explicit encoding option', function (done) {
      const obj = new MemoryAdapter()
      expect(obj.write('foo', 'hello world', { encoding: 'utf16le' })).to.eventually.be.fulfilled.then(() => {
        const read = obj.createReadStream('foo')
        read.on('data', function (chunk) {
          const expected = Buffer.from('hello world', 'utf16le')
          expect(chunk).to.satisfy((c) => expected.equals(c))
          done()
        })
      })
    })
  })
})
