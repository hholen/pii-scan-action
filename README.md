# PII Scan Action

A GitHub Action that scans changed files for personally identifiable information using [openai/privacy-filter](https://huggingface.co/openai/privacy-filter). Runs entirely on the GitHub Actions runner — no data leaves the machine.

## What it catches

| Category | Example |
|---|---|
| `private_person` | Alice Smith |
| `private_email` | alice@example.com |
| `private_phone` | +1-555-867-5309 |
| `private_address` | 123 Elm Street, Springfield |
| `secret` | sk-proj-abc123xyz789 |
| `private_url` | internal URLs |
| `private_date` | dates of birth |
| `account_number` | bank/account numbers |

## Usage

Add this to `.github/workflows/pii-scan.yml` in your repo:

```yaml
name: PII Scanner
on:
  push:
    branches: [main]
  pull_request:

jobs:
  pii-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: hholen/pii-scan-action@main
```

That's it. The action handles Node setup, model caching, and scanning.

## Inputs

| Input | Description | Default |
|---|---|---|
| `threshold` | Confidence threshold for blocking (0.0 to 1.0) | `0.8` |

```yaml
- uses: hholen/pii-scan-action@main
  with:
    threshold: "0.9"
```

## How it works

1. Sets up Node.js 22
2. Caches the quantised privacy-filter model (~900MB) between runs
3. Identifies changed files via `git diff`
4. Scans code files (.ts, .js, .py, .json, .yaml, .md, .env, etc.)
5. Blocks the workflow if PII is found above the confidence threshold

First run downloads the model from Hugging Face. Subsequent runs load from GitHub Actions cache.

## File types scanned

`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.json`, `.yaml`, `.yml`, `.md`, `.env`, `.toml`, `.cfg`, `.ini`, `.html`, `.css`, `.sql`, `.sh`

Skipped: lockfiles, `node_modules/`, binary files, files over 1MB.

## Limitations

- First run is slow (model download ~900MB)
- English text works best; non-English may have lower accuracy
- May flag public names or example domains
- One layer of defence, not a complete privacy solution

## Licence

MIT
