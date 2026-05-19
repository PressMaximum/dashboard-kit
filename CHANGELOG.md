# Changelog

All notable changes to `@pressmaximum/dashboard-kit` are documented in
this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Pre-1.0 caveat: breaking changes are allowed in minor versions
(see [docs/SPEC.md §12](docs/SPEC.md)). The 1.0 milestone locks the
public API per the deprecation cycle in §12.2.

## [Unreleased]

### Notes for maintainers

- npm publish workflow requires the `NPM_TOKEN` repository secret. Add
  it under **Settings → Secrets and variables → Actions** when ready to
  publish 0.1.0.
- Packagist sync is automatic via Packagist's GitHub webhook. Configure
  the webhook once via Packagist's package page → **Settings → API
  integration** so future tags auto-sync.
