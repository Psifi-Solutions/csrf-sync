# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [4.2.0](https://github.com/Psifi-Solutions/csrf-sync/compare/v4.1.0...v4.2.0) (2025-04-30)

This release should be backwards compatible and without breaking changes, however there were a few additional implications of this release.

* Fixing the half-assed build setup and TypeScript config, `csrf-sync` should now officially work with Node v14 and up.
* The build output has flattened, the package no longer contains nested `esm` and `cjs` folders.

### Features

* add skipCsrfProtection configuration option ([41c18d4](https://github.com/Psifi-Solutions/csrf-sync/commit/41c18d41b1c6ec2173f24164ddca9461bfae0e20))

## 4.1.0 (2025-03-23)

### Summary

The only changes with this release is the addition of `commit-and-tag-version` as a dev dependency (for ongoing changelog generation) and a non-breaking
change to allow error customisation via a new optional `errorConfig` option.

### Features

- support error customisation via errorConfig option ([5ab609c](https://github.com/Psifi-Solutions/csrf-sync/commit/5ab609ccff0c433d4adce3bdc195ee8a4c7bbe72))
