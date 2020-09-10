'use strict'

const chai = require('chai')
chai.use(require('chai-as-promised'))
const expect = chai.expect

const { ReadableStreamBuffer, WritableStreamBuffer } = require('stream-buffers')

const Adapter = require('../lib/base.js')

class MockReadAdapter extends Adapter {
  createReadStream (fileName) {
    if (fileName !== 'foo') {
      throw new Error('expected file name to be "foo"')
    }

    if (this.shouldThrow) {
      throw new Error('error thrown during createReadStream')
    }

    const stream = new ReadableStreamBuffer()
    stream.put(Buffer.from('hello world', 'utf8'))
    stream.stop()

    if (this.shouldError) {
      stream.destroy(new Error('error emitted with destroy'))
    }

    return stream
  }
}

class MockWriteAdapter extends Adapter {
  createWriteStream (fileName) {
    if (this.shouldThrow) {
      throw new Error('expected error')
    }

    const stream = new WritableStreamBuffer()
    stream.on('finish', () => {
      this.writtenData = stream.getContents()
    })
    if (this.shouldError) {
      stream._write = function (chunk, encoding, callback) {
        callback(new Error('thrown during _write'))
      }
    }
    return stream
  }
}

describe('lib/base.js', function () {
  describe('#init()', function () {
    it('resolves', function () {
      const obj = new Adapter()
      return expect(obj.init()).to.eventually.be.fulfilled
    })
  })

  describe('#listFiles()', function () {
    it('rejects', function () {
      const obj = new Adapter()
      return expect(obj.listFiles()).to.eventually.be.rejected
    })
  })

  describe('#exists()', function () {
    it('rejects', function () {
      const obj = new Adapter()
      return expect(obj.exists('foo')).to.eventually.be.rejected
    })
  })

  describe('#rename()', function () {
    it('rejects', function () {
      const obj = new Adapter()
      return expect(obj.exists('foo', 'bar')).to.eventually.be.rejected
    })
  })

  describe('#delete()', function () {
    it('rejects', function () {
      const obj = new Adapter()
      return expect(obj.delete('foo')).to.eventually.be.rejected
    })
  })

  describe('#createReadStream()', function () {
    it('throws', function () {
      const obj = new Adapter()
      return expect(() => obj.createReadStream('foo')).to.throw()
    })
  })

  describe('#createWriteStream()', function () {
    it('throws', function () {
      const obj = new Adapter()
      return expect(() => obj.createWriteStream('foo')).to.throw()
    })
  })

  describe('#read()', function () {
    it('rejects if createReadStream not implemented', function () {
      const obj = new Adapter()
      return expect(obj.read('foo')).to.eventually.be.rejected
    })

    it('works if subclass implements createReadStream', function () {
      const obj = new MockReadAdapter()
      return expect(obj.read('foo')).to.eventually.satisfy(c => {
        return Buffer.from('hello world', 'utf8').equals(c)
      })
    })

    it('rejects if createReadStream throws', function () {
      const obj = new MockReadAdapter()
      obj.shouldThrow = true
      return expect(obj.read('foo')).to.eventually.be.rejected
    })

    it('rejects if the stream produces an error', function () {
      const obj = new MockReadAdapter()
      obj.shouldError = true
      return expect(obj.read('foo')).to.eventually.be.rejected
    })

    it('converts to string if passed an encoding', function () {
      const obj = new MockReadAdapter()
      return expect(obj.read('foo', { encoding: 'utf8' }))
        .to.eventually.equal('hello world')
    })

    it('ignores empty options', function () {
      const obj = new MockReadAdapter()
      return expect(obj.read('foo', {})).to.eventually.satisfy(c => {
        return Buffer.from('hello world', 'utf8').equals(c)
      })
    })
  })

  describe('#write()', function () {
    it('rejects if createWriteStream not implemented', function () {
      const obj = new Adapter()
      return expect(obj.write('foo', Buffer.alloc(0))).to.eventually.be.rejected
    })

    it('works if subclass implements createWriteStream', function () {
      const obj = new MockWriteAdapter()
      const data = Buffer.from('hello world', 'utf8')
      return expect(obj.write('foo', data)).to.eventually.be.fulfilled.then(() => {
        return expect(obj.writtenData).to.satisfy(c => data.equals(c))
      })
    })

    it('rejects if createWriteStream throws', function () {
      const obj = new MockWriteAdapter()
      obj.shouldThrow = true
      return expect(obj.write('foo', Buffer.alloc(0))).to.eventually.be.rejected
    })

    it('rejects if the stream produces an error', function () {
      const obj = new MockWriteAdapter()
      obj.shouldError = true
      return expect(obj.write('foo', Buffer.alloc(0))).to.eventually.be.rejected
    })

    it('supports encodings for strings: no options', function () {
      const obj = new MockWriteAdapter()
      return expect(obj.write('foo', 'hello world')).to.eventually.be.fulfilled.then(() => {
        const expected = Buffer.from('hello world', 'utf8')
        return expect(obj.writtenData).to.satisfy(c => expected.equals(c))
      })
    })

    it('supports encodings for strings: empty options', function () {
      const obj = new MockWriteAdapter()
      return expect(obj.write('foo', 'hello world', {})).to.eventually.be.fulfilled.then(() => {
        const expected = Buffer.from('hello world', 'utf8')
        return expect(obj.writtenData).to.satisfy(c => expected.equals(c))
      })
    })

    it('supports encodings for strings: explicit encoding option', function () {
      const obj = new MockWriteAdapter()
      return expect(obj.write('foo', 'hello world', { encoding: 'utf16le' })).to.eventually.be.fulfilled.then(() => {
        const expected = Buffer.from('hello world', 'utf16le')
        return expect(obj.writtenData).to.satisfy(c => expected.equals(c))
      })
    })
  })
})
