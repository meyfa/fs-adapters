import assert from 'assert'
import { Adapter } from '../src/adapter.js'
import { MemoryAdapter } from '../src/memory-adapter.js'

describe('memory-adapter.ts', function () {
  it('extends Adapter', function () {
    assert.ok(MemoryAdapter.prototype instanceof Adapter)
  })

  describe('#init()', function () {
    it('returns a Promise', async function () {
      const obj = new MemoryAdapter()
      await assert.doesNotReject(obj.init())
    })
  })

  describe('#listFiles()', function () {
    it('resolves to an array', async function () {
      const obj = new MemoryAdapter()
      assert.ok(Array.isArray(await obj.listFiles()))
    })

    it('includes initial files, if given a plain object', async function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0),
        'bar.tmp': Buffer.alloc(0),
        baz: Buffer.alloc(0)
      })
      const files = await obj.listFiles()
      assert.deepStrictEqual(files.sort(), ['foo', 'bar.tmp', 'baz'].sort())
    })

    it('includes initial files, if given an Array', async function () {
      const obj = new MemoryAdapter([
        ['foo', Buffer.alloc(0)],
        ['bar.tmp', Buffer.alloc(0)],
        ['baz', Buffer.alloc(0)]
      ])
      const files = await obj.listFiles()
      assert.deepStrictEqual(files.sort(), ['foo', 'bar.tmp', 'baz'].sort())
    })

    it('includes initial files, if given a Map', async function () {
      const obj = new MemoryAdapter(new Map([
        ['foo', Buffer.alloc(0)],
        ['bar.tmp', Buffer.alloc(0)],
        ['baz', Buffer.alloc(0)]
      ]))
      const files = await obj.listFiles()
      assert.deepStrictEqual(files.sort(), ['foo', 'bar.tmp', 'baz'].sort())
    })

    it('converts string data to utf8 Buffer implicitly', async function () {
      const obj = new MemoryAdapter({
        foo: 'hello world'
      })
      const data = Buffer.from('hello world', 'utf8')
      const actual = await obj.read('foo')
      assert.ok(Buffer.isBuffer(actual) && data.equals(actual))
    })
  })

  describe('#exists()', function () {
    it('returns false for missing files', async function () {
      const obj = new MemoryAdapter()
      assert.strictEqual(await obj.exists('foo'), false)
    })

    it('rejects when given nothing', async function () {
      const obj = new MemoryAdapter()
      // @ts-expect-error - missing argument
      await assert.rejects(obj.exists())
    })

    it('returns true for existing files', async function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      assert.strictEqual(await obj.exists('foo'), true)
    })
  })

  describe('#rename()', function () {
    it('rejects for missing files, with code=ENOENT', async function () {
      const obj = new MemoryAdapter()
      await assert.rejects(obj.rename('foo', 'bar'), { code: 'ENOENT' })
    })

    it('rejects for missing files even if renaming to same name', async function () {
      const obj = new MemoryAdapter()
      await assert.rejects(obj.rename('foo', 'foo'), { code: 'ENOENT' })
    })

    it('renames files', async function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      await obj.rename('foo', 'bar')
      assert.deepStrictEqual(await obj.listFiles(), ['bar'])
    })

    it('keeps contents', async function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter({
        foo: data
      })
      await obj.rename('foo', 'bar')
      const read = obj.createReadStream('bar')
      await new Promise<void>((resolve) => {
        read.on('data', function (chunk) {
          assert.ok(data.equals(chunk))
          resolve()
        })
      })
    })

    it('does nothing if name stays the same', async function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      await obj.rename('foo', 'foo')
      assert.deepStrictEqual(await obj.listFiles(), ['foo'])
    })

    it('rejects if source name not a string or is empty', async function () {
      const obj = new MemoryAdapter()
      // @ts-expect-error - null is not a string
      await assert.rejects(obj.rename(null, 'bar'))
      await assert.rejects(obj.rename('', 'bar'))
    })

    it('rejects if new name is not a string or is empty', async function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      // @ts-expect-error - null is not a string
      await assert.rejects(obj.rename('foo', null))
      await assert.rejects(obj.rename('foo', ''))
    })
  })

  describe('#delete()', function () {
    it('rejects for missing files, with code=ENOENT', async function () {
      const obj = new MemoryAdapter()
      await assert.rejects(obj.delete('foo'), { code: 'ENOENT' })
    })

    it('deletes files', async function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      await obj.delete('foo')
      assert.deepStrictEqual(await obj.listFiles(), [])
    })
  })

  describe('#createReadStream()', function () {
    it('throws for missing files, with code=ENOENT', function () {
      const obj = new MemoryAdapter()
      assert.throws(() => obj.createReadStream('foo'), { code: 'ENOENT' })
    })

    it('obtains readable streams for existing files', function () {
      const obj = new MemoryAdapter({
        foo: Buffer.alloc(0)
      })
      const stream = obj.createReadStream('foo')
      assert.ok(typeof stream.read === 'function')
    })

    it('allows reading data', function (done) {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter({
        foo: data
      })
      const stream = obj.createReadStream('foo')
      stream.on('data', function (chunk) {
        assert.ok(data.equals(chunk))
        done()
      })
    })
  })

  describe('#createWriteStream()', function () {
    it('returns writable streams', function () {
      const obj = new MemoryAdapter()
      const stream = obj.createWriteStream('foo')
      assert.ok(typeof stream.write === 'function')
    })

    it('allows writing data', function (done) {
      const obj = new MemoryAdapter()
      const stream = obj.createWriteStream('foo')
      stream.on('finish', function () {
        const read = obj.createReadStream('foo')
        read.on('data', function (chunk) {
          const expected = Buffer.from('hello world', 'utf8')
          assert.ok(expected.equals(chunk))
          done()
        })
      })
      stream.end('hello world', 'utf8')
    })

    it('adds to the list of files', function (done) {
      const obj = new MemoryAdapter()
      const stream = obj.createWriteStream('foo')
      stream.on('finish', async function () {
        assert.deepStrictEqual(await obj.listFiles(), ['foo'])
        done()
      } as () => void)
      stream.end()
    })

    it('throws if name is not a string or is empty', function () {
      const obj = new MemoryAdapter()
      // @ts-expect-error - null is not a string
      assert.throws(() => obj.createWriteStream(null))
      assert.throws(() => obj.createWriteStream(''))
    })
  })

  describe('#read()', function () {
    it('rejects for missing files, with code=ENOENT', async function () {
      const obj = new MemoryAdapter()
      await assert.rejects(obj.read('foo'), { code: 'ENOENT' })
    })

    it('reads existing files', async function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter({
        foo: data
      })
      const actual = await obj.read('foo')
      assert.ok(Buffer.isBuffer(actual) && data.equals(actual))
    })

    it('converts to string if passed an encoding', async function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter({
        foo: data
      })
      assert.strictEqual(await obj.read('foo', 'utf8'), 'hello world')
    })

    it('ignores empty options', async function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter({
        foo: data
      })
      const actual = await obj.read('foo', {})
      assert.ok(Buffer.isBuffer(actual) && data.equals(actual))
    })

    it('treats string options as encoding', async function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter({
        foo: data
      })
      assert.strictEqual(await obj.read('foo', 'utf8'), 'hello world')
    })
  })

  describe('#write()', function () {
    it('writes data', async function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new MemoryAdapter()
      await obj.write('foo', data)
      const read = obj.createReadStream('foo')
      await new Promise<void>((resolve) => {
        read.on('data', function (chunk) {
          assert.ok(data.equals(chunk))
          resolve()
        })
      })
    })

    it('adds to the list of files', async function () {
      const obj = new MemoryAdapter()
      await obj.write('foo', Buffer.alloc(0))
      assert.deepStrictEqual(await obj.listFiles(), ['foo'])
    })

    it('rejects if name is not a string or is empty', async function () {
      const obj = new MemoryAdapter()
      // @ts-expect-error - null is not a string
      await assert.rejects(obj.write(null, Buffer.alloc(0)))
      await assert.rejects(obj.write('', Buffer.alloc(0)))
    })

    it('supports encodings for strings: no options', async function () {
      const obj = new MemoryAdapter()
      await obj.write('foo', 'hello world')
      const read = obj.createReadStream('foo')
      await new Promise<void>((resolve) => {
        read.on('data', function (chunk) {
          const expected = Buffer.from('hello world', 'utf8')
          assert.ok(expected.equals(chunk))
          resolve()
        })
      })
    })

    it('supports encodings for strings: empty options', async function () {
      const obj = new MemoryAdapter()
      await obj.write('foo', 'hello world', {})
      const read = obj.createReadStream('foo')
      await new Promise<void>((resolve) => {
        read.on('data', function (chunk) {
          const expected = Buffer.from('hello world', 'utf8')
          assert.ok(expected.equals(chunk))
          resolve()
        })
      })
    })

    it('supports encodings for strings: explicit encoding option', async function () {
      const obj = new MemoryAdapter()
      await obj.write('foo', 'hello world', { encoding: 'utf16le' })
      const read = obj.createReadStream('foo')
      await new Promise<void>((resolve) => {
        read.on('data', function (chunk) {
          const expected = Buffer.from('hello world', 'utf16le')
          assert.ok(expected.equals(chunk))
          resolve()
        })
      })
    })

    it('supports encodings for strings: string parameter', async function () {
      const obj = new MemoryAdapter()
      await obj.write('foo', 'hello world', 'utf16le')
      const read = obj.createReadStream('foo')
      await new Promise<void>((resolve) => {
        read.on('data', function (chunk) {
          const expected = Buffer.from('hello world', 'utf16le')
          assert.ok(expected.equals(chunk))
          resolve()
        })
      })
    })
  })
})
