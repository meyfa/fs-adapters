import assert from 'assert'
import path from 'path'
import fs from 'fs'
import rimraf from 'rimraf'
import { Adapter } from '../src/adapter.js'
import { DirectoryAdapter } from '../src/directory-adapter.js'

const RESOURCES_DIR: string = path.join(__dirname, 'res')
const NON_EXISTENT_DIR: string = path.join(__dirname, 'res', 'noex')

describe('directory-adapter.ts', function () {
  beforeEach(function () {
    rimraf.sync(RESOURCES_DIR)
    fs.mkdirSync(RESOURCES_DIR)
    fs.writeFileSync(path.join(RESOURCES_DIR, 'test.txt'), 'hello world')
  })

  after(function () {
    rimraf.sync(RESOURCES_DIR)
  })

  it('extends Adapter', function () {
    assert.ok(DirectoryAdapter.prototype instanceof Adapter)
  })

  describe('#_resolve()', function () {
    // helper function to avoid repeating ts-expect-error
    // @ts-expect-error
    const callResolve = (obj: DirectoryAdapter, ...args: any[]): any => obj._resolve(...args)

    it('throws when resolving to base directory itself', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      assert.throws(() => callResolve(obj, ''))
      assert.throws(() => callResolve(obj, '.'))
      assert.throws(() => callResolve(obj, './'))
      assert.throws(() => callResolve(obj, 'foo/..'))
      assert.throws(() => callResolve(obj, 'foo/../'))
      assert.throws(() => callResolve(obj, RESOURCES_DIR))
    })

    it('throws when resolving to parent directories', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      assert.throws(() => callResolve(obj, '..'))
      assert.throws(() => callResolve(obj, '../../'))
    })

    it('throws when resolving files outside base directory', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      assert.throws(() => callResolve(obj, '../directory-adapter.test.ts'))
      assert.throws(() => callResolve(obj, 'foo/../../directory-adapter.test.ts'))
    })

    it('throws when resolving absolute paths', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      assert.throws(() => callResolve(obj, RESOURCES_DIR + '/foo.bin'))
    })

    it('throws for paths containing a slash', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      assert.throws(() => callResolve(obj, 'foo/bar/qux.bin'))
    })
  })

  describe('#init()', function () {
    it('returns a Promise', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await assert.doesNotReject(obj.init())
    })

    it('creates base directory if necessary', async function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      await obj.init()
      const stats = await fs.promises.lstat(NON_EXISTENT_DIR)
      assert.strictEqual(stats.isDirectory(), true)
    })

    it('rejects if base path denotes a file', async function () {
      const obj = new DirectoryAdapter(path.join(RESOURCES_DIR, 'test.txt'))
      await assert.rejects(obj.init())
    })
  })

  describe('#listFiles()', function () {
    it('resolves to an array', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      assert.ok(Array.isArray(await obj.listFiles()))
    })

    it('includes existing files', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      assert.deepStrictEqual(await obj.listFiles(), ['test.txt'])
    })

    it('rejects for base paths that are files', async function () {
      const obj = new DirectoryAdapter(path.join(RESOURCES_DIR, 'test.txt'))
      await assert.rejects(obj.listFiles())
    })

    it('resolves to empty array for non-existent base directory', async function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      assert.deepStrictEqual(await obj.listFiles(), [])
    })
  })

  describe('#exists()', function () {
    it('returns false for non-existent files', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      assert.strictEqual(await obj.exists('doesnotexist.txt'), false)
    })

    it('returns false for non-existent base directory', async function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      assert.strictEqual(await obj.exists('test.txt'), false)
    })

    it('rejects when given nothing', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      // @ts-expect-error
      await assert.rejects(obj.exists())
    })

    it('returns true for existing files', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      assert.strictEqual(await obj.exists('test.txt'), true)
    })
  })

  describe('#rename()', function () {
    it('rejects for missing files, with code=ENOENT', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await assert.rejects(obj.rename('doesnotexist.txt', 'bar.txt'), { code: 'ENOENT' })
    })

    it('rejects for missing files even if renaming to same name', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await assert.rejects(obj.rename('doesnotexist.txt', 'doesnotexist.txt'), { code: 'ENOENT' })
    })

    it('rejects for non-existent base directory, with code=ENOENT', async function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      await assert.rejects(obj.rename('test.txt', 'bar.txt'), { code: 'ENOENT' })
    })

    it('succeeds for existing files', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await obj.rename('test.txt', 'renamed.txt')
      assert.deepStrictEqual(await fs.promises.readdir(RESOURCES_DIR), ['renamed.txt'])
    })

    it('rejects if source name not a string or is empty', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      // @ts-expect-error
      await assert.rejects(obj.rename(null, 'bar.txt'))
      await assert.rejects(obj.rename('', 'bar.txt'))
    })

    it('rejects if new name is not a string or is empty', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      // @ts-expect-error
      await assert.rejects(obj.rename('test.txt', null))
      await assert.rejects(obj.rename('test.txt', ''))
    })
  })

  describe('#delete()', function () {
    it('rejects for missing files, with code=ENOENT', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await assert.rejects(obj.delete('doesnotexist.txt'), { code: 'ENOENT' })
    })

    it('rejects for non-existent base directory, with code=ENOENT', async function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      await assert.rejects(obj.delete('test.txt'), { code: 'ENOENT' })
    })

    it('succeeds for existing files', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await obj.delete('test.txt')
      assert.deepStrictEqual(await fs.promises.readdir(RESOURCES_DIR), [])
    })
  })

  describe('#createReadStream()', function () {
    it('obtains a stream that errors for missing files, with code=ENOENT', function (done) {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createReadStream('doesnotexist.txt')
      assert.ok(typeof stream === 'object' && stream != null)
      stream.on('error', err => {
        assert.ok(err instanceof Error && 'code' in err)
        assert.strictEqual(err.code, 'ENOENT')
        done()
      })
    })

    it('obtains a stream that errors for non-existent base directory, with code=ENOENT', function (done) {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      const stream = obj.createReadStream('test.txt')
      assert.ok(typeof stream === 'object' && stream != null)
      stream.on('error', err => {
        assert.ok(err instanceof Error && 'code' in err)
        assert.strictEqual(err.code, 'ENOENT')
        done()
      })
    })

    it('obtains readable streams for existing files', function (done) {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createReadStream('test.txt')
      assert.ok(typeof stream.read === 'function')
      stream.on('close', done)
      stream.destroy()
    })

    it('allows reading data', function (done) {
      const expected = Buffer.from('hello world', 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createReadStream('test.txt')
      stream.on('data', function (chunk) {
        assert.ok(expected.equals(chunk))
        stream.on('close', done)
        stream.destroy()
      })
    })
  })

  describe('#createWriteStream()', function () {
    it('returns writable streams', function (done) {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createWriteStream('foo.bin')
      assert.ok(typeof stream.write === 'function')
      stream.on('close', done)
      stream.destroy()
    })

    it('allows writing data', function (done) {
      const data = Buffer.from(`t${Date.now()}`, 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const stream = obj.createWriteStream('foo.bin')
      stream.on('finish', function () {
        const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
        assert.ok(data.equals(writtenData))
        stream.on('close', done)
      })
      stream.end(data)
    })

    it('throws if name is not a string or is empty', function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      // @ts-expect-error
      assert.throws(() => obj.createWriteStream(null))
      assert.throws(() => obj.createWriteStream(''))
    })
  })

  describe('#read()', function () {
    it('rejects for missing files, with code=ENOENT', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await assert.rejects(obj.read('doesnotexist.txt'), { code: 'ENOENT' })
    })

    it('rejects for non-existent base directory, with code=ENOENT', async function () {
      const obj = new DirectoryAdapter(NON_EXISTENT_DIR)
      await assert.rejects(obj.read('test.txt'), { code: 'ENOENT' })
    })

    it('reads existing files', async function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const actual = await obj.read('test.txt')
      assert.ok(Buffer.isBuffer(actual) && data.equals(actual))
    })

    it('converts to string if passed an encoding', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      assert.strictEqual(await obj.read('test.txt', 'utf8'), 'hello world')
    })

    it('ignores empty options', async function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      const actual = await obj.read('test.txt', {})
      assert.ok(Buffer.isBuffer(actual) && data.equals(actual))
    })

    it('treats string options as encoding', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      assert.strictEqual(await obj.read('test.txt', 'utf8'), 'hello world')
    })
  })

  describe('#write()', function () {
    it('writes data', async function () {
      const data = Buffer.from('hello world', 'utf8')
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await obj.write('foo.bin', data)
      const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
      assert.ok(data.equals(writtenData))
    })

    it('rejects if name is not a string or is empty', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      // @ts-expect-error
      await assert.rejects(obj.write(null, Buffer.alloc(0)))
      await assert.rejects(obj.write('', Buffer.alloc(0)))
    })

    it('supports encodings for strings: no options', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await obj.write('foo.bin', 'hello world')
      const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
      const expected = Buffer.from('hello world', 'utf8')
      assert.ok(expected.equals(writtenData))
    })

    it('supports encodings for strings: empty options', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await obj.write('foo.bin', 'hello world', {})
      const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
      const expected = Buffer.from('hello world', 'utf8')
      assert.ok(expected.equals(writtenData))
    })

    it('supports encodings for strings: explicit encoding option', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await obj.write('foo.bin', 'hello world', { encoding: 'utf16le' })
      const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
      const expected = Buffer.from('hello world', 'utf16le')
      assert.ok(expected.equals(writtenData))
    })

    it('supports encodings for strings: string parameter', async function () {
      const obj = new DirectoryAdapter(RESOURCES_DIR)
      await obj.write('foo.bin', 'hello world', 'utf16le')
      const writtenData = fs.readFileSync(path.join(RESOURCES_DIR, 'foo.bin'))
      const expected = Buffer.from('hello world', 'utf16le')
      assert.ok(expected.equals(writtenData))
    })
  })
})
