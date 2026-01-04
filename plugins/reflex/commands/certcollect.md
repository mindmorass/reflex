---
description: Collect SSL/TLS certificates from websites
allowed-tools: Bash(openssl:*), Bash(echo:*)
argument-hint: <hostname> [-v|--verbose] [-c|--chain]
---

# Certificate Collection

Collect SSL/TLS certificates from a website using openssl.

## Instructions

Extract the hostname from the user's input (remove https:// if present).

### Basic certificate fetch:

```bash
echo | openssl s_client -connect <hostname>:443 -servername <hostname> 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```

### With `-v` or `--verbose`, show full details:

```bash
echo | openssl s_client -connect <hostname>:443 -servername <hostname> 2>/dev/null | openssl x509 -noout -text
```

### With `-c` or `--chain`, show full certificate chain:

```bash
echo | openssl s_client -connect <hostname>:443 -servername <hostname> -showcerts 2>/dev/null
```

### To save certificate to file:

```bash
echo | openssl s_client -connect <hostname>:443 -servername <hostname> 2>/dev/null | openssl x509 -outform PEM > ~/Desktop/<hostname>.pem
```

## Examples

- `/reflex:certcollect github.com` - Basic cert info
- `/reflex:certcollect github.com -v` - Full certificate details
- `/reflex:certcollect github.com -c` - Show full chain
