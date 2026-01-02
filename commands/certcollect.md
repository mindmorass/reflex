---
description: Collect SSL/TLS certificates from websites
allowed-tools: Bash(npm start -- certcollect:*), Bash(openssl:*)
argument-hint: <url> [-v] [-c] [-o path] [-f pem|der|both]
---

# Certificate Collection

Collect SSL/TLS certificates from a website using openssl.

## Command

```bash
!npm start -- certcollect $ARGUMENTS 2>&1 | grep -v "DEP0040\|punycode\|node --trace"
```

## Options

- `-v, --verbose` - Show certificate details (subject, issuer, validity, SANs)
- `-c, --chain` - Include full certificate chain
- `-o, --output <path>` - Output directory (default: ~/Desktop)
- `-f, --format <format>` - Output format: pem, der, or both

## Examples

- `/reflex:certcollect github.com` - Get GitHub's certificate
- `/reflex:certcollect github.com -v -c` - Verbose with full chain
