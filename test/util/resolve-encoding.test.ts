import assert from 'node:assert'
import { resolveEncoding } from '../../src/util/resolve-encoding.js'

describe('util/resolve-encoding.ts', function () {
  it('returns strings directly', function () {
    assert.strictEqual(resolveEncoding('utf8'), 'utf8')
    assert.strictEqual(resolveEncoding('ascii'), 'ascii')
  })

  it('returns strings from options object', function () {
    assert.strictEqual(resolveEncoding({ encoding: 'utf8' }), 'utf8')
    assert.strictEqual(resolveEncoding({ encoding: 'ascii' }), 'ascii')
  })

  it('returns undefined for null or undefined', function () {
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    assert.strictEqual(resolveEncoding(undefined), undefined)
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    assert.strictEqual(resolveEncoding(null), undefined)
  })

  it('returns undefined for objects without encoding', function () {
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    assert.strictEqual(resolveEncoding({}), undefined)
    assert.strictEqual(resolveEncoding({ a: 42 }), undefined)
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    assert.strictEqual(resolveEncoding({ encoding: undefined }), undefined)
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    assert.strictEqual(resolveEncoding({ encoding: null }), undefined)
  })
})
