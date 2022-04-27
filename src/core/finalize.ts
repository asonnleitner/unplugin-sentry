import type { SentryCliPluginOptions } from '../types'
import type { SentryCliUploadSourceMapsOptions } from '@sentry/cli'
import type SentryCli from '@sentry/cli'

export const finalizeRelease = async (
  cli: SentryCli,
  opts: SentryCliPluginOptions,
  releasePromise: Promise<string>,
  compilation?: any
) => {
  const { include, errorHandler = (_, invokeErr) => invokeErr() } = opts
  try {
    const release = await releasePromise

    if (!include) new Error('[sentry-unplugin] include is required.')
    if (!release)
      new Error(
        '[sentry-unplugin] Unable to determine release. Make sure to include `release` option or use a environment that supports auto-detection.\nhttps://docs.sentry.io/cli/releases/#creating-releases'
      )

    // create new release
    await cli.releases.new(release)

    // clean artifacts
    if (opts.cleanArtifacts) {
      await cli.releases.execute(
        ['releases', 'files', release, 'delete', '--all'],
        true
      )
    }

    // upload sourcemaps
    await cli.releases.uploadSourceMaps(
      release,
      opts as SentryCliUploadSourceMapsOptions
    )

    // set commit
    const { auto, repo, commit, previousCommit, ignoreMissing, ignoreEmpty } =
      opts.setCommits || opts

    if (auto || (repo && commit)) {
      await cli.releases.setCommits(release, {
        auto,
        repo,
        commit,
        previousCommit,
        ignoreMissing,
        ignoreEmpty
      })
    }

    // finalize
    if (opts.finalize) {
      await cli.releases.finalize(release)
    }

    // new deployment
    const { env, started, finished, time, name, url } = opts.deploy || {}
    if (env) {
      await cli.releases.newDeploy(release, {
        env,
        started,
        finished,
        time,
        name,
        url
      })
    }
  } catch (err) {
    errorHandler(err as Error, () =>
      compilation && compilation.errors
        ? compilation.errors.push(
            new Error(`[sentry-unplugin] ${(err as Error).message}`)
          )
        : new Error(`[sentry-unplugin] ${(err as Error).message}`)
    )
  }
}
