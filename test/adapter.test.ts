import stream from 'stream'
import { ReadableStreamBuffer, WritableStreamBuffer } from 'stream-buffers'

import { Adapter } from '../src/adapter'

import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

class MockReadAdapter extends Adapter {
  shouldThrow: boolean = false
  shouldError: boolean = false

  override createReadStream (fileName: string): stream.Readable {
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
  shouldThrow: boolean = false
  shouldError: boolean = false
  writtenData: Buffer | undefined

  override createWriteStream (fileName: string): stream.Writable {
    if (this.shouldThrow) {
      throw new Error('expected error')
    }

    const stream = new WritableStreamBuffer()
    stream.on('finish', () => {
      const result: Buffer | false = stream.getContents()
      this.writtenData = result === false ? Buffer.alloc(0) : result
    })
    if (this.shouldError) {
      stream._write = function (chunk, encoding, callback) {
        callback(new Error('thrown during _write'))
      }
    }
    return stream
  }
}

describe('adapter.ts', function () {
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
      return expect(obj.rename('foo', 'bar')).to.eventually.be.rejected
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
      return expect(obj.read('foo')).to.eventually.satisfy((c: Buffer) => {
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
      return expect(obj.read('foo', {})).to.eventually.satisfy((c: Buffer) => {
        return Buffer.from('hello world', 'utf8').equals(c)
      })
    })

    it('treats string options as encoding', function () {
      const obj = new MockReadAdapter()
      return expect(obj.read('foo', 'utf8')).to.eventually.equal('hello world')
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
        return expect(obj.writtenData).to.satisfy((c: Buffer) => data.equals(c))
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
        return expect(obj.writtenData).to.satisfy((c: Buffer) => expected.equals(c))
      })
    })

    it('supports encodings for strings: empty options', function () {
      const obj = new MockWriteAdapter()
      return expect(obj.write('foo', 'hello world', {})).to.eventually.be.fulfilled.then(() => {
        const expected = Buffer.from('hello world', 'utf8')
        return expect(obj.writtenData).to.satisfy((c: Buffer) => expected.equals(c))
      })
    })

    it('supports encodings for strings: explicit encoding option', function () {
      const obj = new MockWriteAdapter()
      return expect(obj.write('foo', 'hello world', { encoding: 'utf16le' })).to.eventually.be.fulfilled.then(() => {
        const expected = Buffer.from('hello world', 'utf16le')
        return expect(obj.writtenData).to.satisfy((c: Buffer) => expected.equals(c))
      })
    })

    it('supports encodings for strings: string parameter', function () {
      const obj = new MockWriteAdapter()
      return expect(obj.write('foo', 'hello world', 'utf16le')).to.eventually.be.fulfilled.then(() => {
        const expected = Buffer.from('hello world', 'utf16le')
        return expect(obj.writtenData).to.satisfy((c: Buffer) => expected.equals(c))
      })
    })
  })
})
