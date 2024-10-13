import assert from 'node:assert'
import stream from 'node:stream'
import { ReadableStreamBuffer, WritableStreamBuffer } from 'stream-buffers'
import { Adapter } from '../src/adapter.js'

class MockReadAdapter extends Adapter {
  shouldThrow = false
  shouldError = false

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
  shouldThrow = false
  shouldError = false
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
    it('resolves', async function () {
      const obj = new Adapter()
      await assert.doesNotReject(obj.init())
    })
  })

  describe('#listFiles()', function () {
    it('rejects', async function () {
      const obj = new Adapter()
      await assert.rejects(obj.listFiles())
    })
  })

  describe('#exists()', function () {
    it('rejects', async function () {
      const obj = new Adapter()
      await assert.rejects(obj.exists('foo'))
    })
  })

  describe('#rename()', function () {
    it('rejects', async function () {
      const obj = new Adapter()
      await assert.rejects(obj.rename('foo', 'bar'))
    })
  })

  describe('#delete()', function () {
    it('rejects', async function () {
      const obj = new Adapter()
      await assert.rejects(obj.delete('foo'))
    })
  })

  describe('#createReadStream()', function () {
    it('throws', function () {
      const obj = new Adapter()
      assert.throws(() => obj.createReadStream('foo'))
    })
  })

  describe('#createWriteStream()', function () {
    it('throws', function () {
      const obj = new Adapter()
      assert.throws(() => obj.createWriteStream('foo'))
    })
  })

  describe('#read()', function () {
    it('rejects if createReadStream not implemented', async function () {
      const obj = new Adapter()
      await assert.rejects(obj.read('foo'))
    })

    it('works if subclass implements createReadStream', async function () {
      const obj = new MockReadAdapter()
      const expected = Buffer.from('hello world', 'utf8')
      const actual = await obj.read('foo')
      assert.ok(Buffer.isBuffer(actual) && expected.equals(actual))
    })

    it('rejects if createReadStream throws', async function () {
      const obj = new MockReadAdapter()
      obj.shouldThrow = true
      await assert.rejects(obj.read('foo'))
    })

    it('rejects if the stream produces an error', async function () {
      const obj = new MockReadAdapter()
      obj.shouldError = true
      await assert.rejects(obj.read('foo'))
    })

    it('converts to string if passed an encoding', async function () {
      const obj = new MockReadAdapter()
      assert.strictEqual(await obj.read('foo', { encoding: 'utf8' }), 'hello world')
    })

    it('ignores empty options', async function () {
      const obj = new MockReadAdapter()
      const expected = Buffer.from('hello world', 'utf8')
      const actual = await obj.read('foo', {})
      assert.ok(Buffer.isBuffer(actual) && expected.equals(actual))
    })

    it('treats string options as encoding', async function () {
      const obj = new MockReadAdapter()
      assert.strictEqual(await obj.read('foo', 'utf8'), 'hello world')
    })
  })

  describe('#write()', function () {
    it('rejects if createWriteStream not implemented', async function () {
      const obj = new Adapter()
      await assert.rejects(obj.write('foo', Buffer.alloc(0)))
    })

    it('works if subclass implements createWriteStream', async function () {
      const obj = new MockWriteAdapter()
      const data = Buffer.from('hello world', 'utf8')
      await obj.write('foo', data)
      assert.ok(obj.writtenData != null)
      assert.ok(data.equals(obj.writtenData))
    })

    it('rejects if createWriteStream throws', async function () {
      const obj = new MockWriteAdapter()
      obj.shouldThrow = true
      await assert.rejects(obj.write('foo', Buffer.alloc(0)))
    })

    it('rejects if the stream produces an error', async function () {
      const obj = new MockWriteAdapter()
      obj.shouldError = true
      await assert.rejects(obj.write('foo', Buffer.alloc(0)))
    })

    it('supports encodings for strings: no options', async function () {
      const obj = new MockWriteAdapter()
      await obj.write('foo', 'hello world')
      const expected = Buffer.from('hello world', 'utf8')
      assert.ok(obj.writtenData != null)
      assert.ok(expected.equals(obj.writtenData))
    })

    it('supports encodings for strings: empty options', async function () {
      const obj = new MockWriteAdapter()
      await obj.write('foo', 'hello world', {})
      const expected = Buffer.from('hello world', 'utf8')
      assert.ok(obj.writtenData != null)
      assert.ok(expected.equals(obj.writtenData))
    })

    it('supports encodings for strings: explicit encoding option', async function () {
      const obj = new MockWriteAdapter()
      await obj.write('foo', 'hello world', { encoding: 'utf16le' })
      const expected = Buffer.from('hello world', 'utf16le')
      assert.ok(obj.writtenData != null)
      assert.ok(expected.equals(obj.writtenData))
    })

    it('supports encodings for strings: string parameter', async function () {
      const obj = new MockWriteAdapter()
      await obj.write('foo', 'hello world', 'utf16le')
      const expected = Buffer.from('hello world', 'utf16le')
      assert.ok(obj.writtenData != null)
      assert.ok(expected.equals(obj.writtenData))
    })
  })
})
