import { getErrorCode } from '../../src/util/get-error-code.js'

import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

describe('util/get-error-code.ts', function () {
  it('returns undefined for things that are not objects', function () {
    expect(getErrorCode(undefined)).to.be.undefined
    expect(getErrorCode(null)).to.be.undefined
    expect(getErrorCode(true)).to.be.undefined
    expect(getErrorCode(0)).to.be.undefined
    expect(getErrorCode(1)).to.be.undefined
    expect(getErrorCode('')).to.be.undefined
  })

  it('returns undefined for objects without code property', function () {
    expect(getErrorCode({})).to.be.undefined
    expect(getErrorCode([])).to.be.undefined
  })

  it('returns undefined for code values that are not strings', function () {
    expect(getErrorCode({ code: undefined })).to.be.undefined
    expect(getErrorCode({ code: null })).to.be.undefined
    expect(getErrorCode({ code: 42 })).to.be.undefined
  })

  it('returns code value if valid string', function () {
    expect(getErrorCode({ code: 'foobar' })).to.equal('foobar')
    expect(getErrorCode({ code: 'foobar2', message: 'baz' })).to.equal('foobar2')
  })
})
