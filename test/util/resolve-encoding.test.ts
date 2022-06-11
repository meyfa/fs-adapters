import { resolveEncoding } from '../../src/util/resolve-encoding'

import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

describe('util/resolve-encoding.ts', function () {
  it('returns strings directly', function () {
    expect(resolveEncoding('utf8')).to.equal('utf8')
    expect(resolveEncoding('ascii')).to.equal('ascii')
  })

  it('returns strings from options object', function () {
    expect(resolveEncoding({ encoding: 'utf8' })).to.equal('utf8')
    expect(resolveEncoding({ encoding: 'ascii' })).to.equal('ascii')
  })

  it('returns undefined for null or undefined', function () {
    expect(resolveEncoding(undefined)).to.be.undefined
    expect(resolveEncoding(null)).to.be.undefined
  })

  it('returns undefined for objects without encoding', function () {
    expect(resolveEncoding({})).to.be.undefined
    expect(resolveEncoding({ a: 42 })).to.be.undefined
    expect(resolveEncoding({ encoding: undefined })).to.be.undefined
    expect(resolveEncoding({ encoding: null })).to.be.undefined
  })
})
