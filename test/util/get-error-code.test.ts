import assert from 'node:assert'
import { getErrorCode } from '../../src/util/get-error-code.js'

describe('util/get-error-code.ts', function () {
  it('returns undefined for things that are not objects', function () {
    assert.strictEqual(getErrorCode(undefined), undefined)
    assert.strictEqual(getErrorCode(null), undefined)
    assert.strictEqual(getErrorCode(true), undefined)
    assert.strictEqual(getErrorCode(0), undefined)
    assert.strictEqual(getErrorCode(1), undefined)
    assert.strictEqual(getErrorCode(''), undefined)
  })

  it('returns undefined for objects without code property', function () {
    assert.strictEqual(getErrorCode({}), undefined)
    assert.strictEqual(getErrorCode([]), undefined)
  })

  it('returns undefined for code values that are not strings', function () {
    assert.strictEqual(getErrorCode({ code: undefined }), undefined)
    assert.strictEqual(getErrorCode({ code: null }), undefined)
    assert.strictEqual(getErrorCode({ code: 42 }), undefined)
  })

  it('returns code value if valid string', function () {
    assert.strictEqual(getErrorCode({ code: 'foobar' }), 'foobar')
    assert.strictEqual(getErrorCode({ code: 'foobar2', message: 'baz' }), 'foobar2')
  })
})
