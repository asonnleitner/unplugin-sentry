// @ts-nocheck
import createSentryCli from '../src/core/cli'

import SentryCliPlugin from '../src/webpack'

const mockCli = {
  releases: {
    new: jest.fn(() => Promise.resolve()),
    setCommits: jest.fn(() => Promise.resolve()),
    finalize: jest.fn(() => Promise.resolve()),
    proposeVersion: jest.fn(() => Promise.resolve()),
    uploadSourceMaps: jest.fn(() => Promise.resolve()),
    listDeploys: jest.fn(() => Promise.resolve()),
    newDeploy: jest.fn(() => Promise.resolve()),
    execute: jest.fn(() => Promise.resolve())
  }
}

const SentryCliMock = jest.fn((configFile, options) => mockCli)
const SentryCli = jest.mock('@sentry/cli', () => SentryCliMock)
const defaults = { finalize: true, rewrite: true }

beforeEach(() => {
  jest.clearAllMocks()
})

describe('createSentryCli', () => {
  it('uses defaults', () => {
    const cli = createSentryCli()
    expect(cli.options).toEqual(defaults)
  })

  it('merge defaults with options', () => {
    const cli = createSentryCli({ silent: true })
    expect(cli.options).toEqual(expect.objectContaining(defaults))
    expect(cli.options?.silent).toEqual(true)
  })

  it('use defined options over defaults', () => {
    const cli = createSentryCli({ silent: true, finalize: false })
    expect(cli.options?.silent).toEqual(true)
    expect(cli.options?.finalize).toEqual(false)
  })

  it('convert non-array options `include` and `ignore` to array', () => {
    const cli = createSentryCli({ include: 'foo', ignore: 'bar' })
    expect(cli.options).toEqual(expect.objectContaining(defaults))
    expect(cli.options?.include).toEqual(['foo'])
    expect(cli.options?.ignore).toEqual(['bar'])

    const { options: options2 } = createSentryCli({
      include: { paths: ['foo'], urlPrefix: '~/bar/' }
    })

    expect(options2?.include).toEqual([{ paths: ['foo'], urlPrefix: '~/bar/' }])
  })

  it('keeps array options `include` and `ignore`', () => {
    const cli = createSentryCli({
      include: ['foo', 'bar'],
      ignore: ['baz', 'qux']
    })

    expect(cli.options?.include).toEqual(['foo', 'bar'])
    expect(cli.options?.ignore).toEqual(['baz', 'qux'])

    const { options: options2 } = createSentryCli({
      include: [{ paths: ['foo'], urlPrefix: '~/bar/' }]
    })

    expect(options2?.include).toEqual([{ paths: ['foo'], urlPrefix: '~/bar/' }])
  })

  it('convert non-array `ingore` in object `include` options', () => {
    const { options } = createSentryCli({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      include: [{ paths: ['foo'], ignore: 'bar' }]
    })

    expect(options?.include).toEqual([{ paths: ['foo'], ignore: ['bar'] }])
  })

  it('keeps array options `ignore` in object `include` option', () => {
    const { options } = createSentryCli({
      include: [{ paths: ['foo'], ignore: ['bar', 'baz'] }]
    })

    expect(options?.include).toEqual([
      { paths: ['foo'], ignore: ['bar', 'baz'] }
    ])
  })

  it('convert non-array `ignore` in non-array object `include` options', () => {
    const { options } = createSentryCli({
      include: { paths: ['foo'], ignore: 'bar' }
    })

    expect(options?.include).toEqual([{ paths: ['foo'], ignore: ['bar'] }])
  })
})

describe('CLI Config', () => {
  it('parse config file', () => {
    const sentryCliPlugin = SentryCliPlugin({
      configFile: 'some/sentry.properties'
    })

    // expect(SentryCliMock).toHaveBeenCalledWith('some/sentry.properties', {
    //   silent: false
    // })
  })
})
