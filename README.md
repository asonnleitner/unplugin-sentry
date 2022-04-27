# unplugin-sentry

> Unified sentry cli plugin, built with unplugin, still in development.

## Development

Feel free to fork and submit any issues or pull requests.

To run the project simply run `pnpm i` to install all dependencies. Then you can run the dev server with `pnpm dev`.
Which uses `tsup` to compile the typescript files.

You can also run all bundlers (`webpack`, `vite`, `rollup` and `esbuild`) at once using the `unplugin-sentry` by
running `pnpm dev:compilers:build`. If you wanna debug just on one of the compilers run the `dev:build` script in the
desired `playground` directory.

Also quick summary for the `playground` scripts:

- `dev:build`: Runs the build command for the current bundler. (e.g. for vite `vite build`), and is rerun after each
  change made in the `src` directory.
- `dev`: Runs the dev server for the current bundler. (e.g. for vite `vite` or webpack `webpack-dev-server`). Also this
  script will rerun after any changes made in the `src` directory.

---

## Status summary

| Compiler  | Status                                                        |
|-----------|---------------------------------------------------------------|
| `webpack` | 🔥 - needs some refactoring, and test                         |
| `vite`    | 🚧 - need to check how inject entry                           |
| `rollup`  | 🚧 - need to check how inject entry (vite uses)               |
| `esbuild` | 🚧 - need to check how inject entry (vite uses, only for dev) |
| `nuxt`    | 🚧 - uses webpack and vite                                    |
