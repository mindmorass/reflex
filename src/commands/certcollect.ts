import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { resolve, basename } from 'path';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('commands:certcollect');

export interface CertCollectOptions {
  verbose?: boolean;
  simple?: boolean;
  output?: string;
  chain?: boolean;
  format?: 'pem' | 'der' | 'both';
}

export interface CertCollectArgs {
  url: string;
  port?: number;
}

interface Certificate {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  sans?: string[];
  fingerprint?: string;
  pem: string;
}

interface CertCollectResult {
  hostname: string;
  port: number;
  certificates: Certificate[];
  savedFiles: string[];
  error?: string;
}

export async function certcollect(
  args: CertCollectArgs,
  options: CertCollectOptions = {}
): Promise<CertCollectResult> {
  const {
    verbose = false,
    output = resolve(homedir(), 'Desktop'),
    chain = false,
    format = 'pem',
  } = options;

  const hostname = extractHostname(args.url);
  const port = args.port || 443;

  logger.info('Executing certcollect command', { hostname, port, verbose, chain, format });

  const result: CertCollectResult = {
    hostname,
    port,
    certificates: [],
    savedFiles: [],
  };

  // Ensure output directory exists
  if (!existsSync(output)) {
    try {
      mkdirSync(output, { recursive: true });
      logger.debug(`Created output directory: ${output}`);
    } catch (error) {
      result.error = `Failed to create output directory: ${output}`;
      return result;
    }
  }

  try {
    // Use openssl s_client to get certificates
    const certs = await fetchCertificates(hostname, port, chain);

    for (let i = 0; i < certs.length; i++) {
      const cert = certs[i];
      result.certificates.push(cert);

      // Save certificate files
      const suffix = i === 0 ? '' : `-chain-${i}`;
      const baseName = `${hostname}${suffix}`;

      if (format === 'pem' || format === 'both') {
        const pemPath = resolve(output, `${baseName}.crt`);
        writeFileSync(pemPath, cert.pem);
        result.savedFiles.push(pemPath);
        logger.debug(`Saved PEM: ${pemPath}`);
      }

      if (format === 'der' || format === 'both') {
        const derPath = resolve(output, `${baseName}.der`);
        const derContent = pemToDer(cert.pem);
        writeFileSync(derPath, derContent);
        result.savedFiles.push(derPath);
        logger.debug(`Saved DER: ${derPath}`);
      }
    }

    logger.info(`Collected ${certs.length} certificate(s)`);
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Certificate collection failed';
    logger.error('Certificate collection failed', error);
  }

  return result;
}

function extractHostname(url: string): string {
  // Remove protocol if present
  let hostname = url.replace(/^https?:\/\//, '');
  // Remove path if present
  hostname = hostname.split('/')[0];
  // Remove port if present
  hostname = hostname.split(':')[0];
  return hostname;
}

async function fetchCertificates(hostname: string, port: number, chain: boolean): Promise<Certificate[]> {
  const certificates: Certificate[] = [];

  try {
    // Get certificates using openssl
    const showCerts = chain ? '-showcerts' : '';
    const cmd = `echo | openssl s_client -connect ${hostname}:${port} -servername ${hostname} ${showCerts} 2>/dev/null`;

    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

    // Extract PEM certificates
    const pemBlocks = output.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];

    for (const pem of pemBlocks) {
      const certInfo = parseCertificate(pem);
      certificates.push({
        ...certInfo,
        pem,
      });
    }
  } catch (error) {
    logger.error('Failed to fetch certificates', error);
    throw new Error(`Failed to connect to ${hostname}:${port}`);
  }

  return certificates;
}

function parseCertificate(pem: string): Omit<Certificate, 'pem'> {
  const result: Omit<Certificate, 'pem'> = {
    subject: '',
    issuer: '',
    validFrom: '',
    validTo: '',
  };

  try {
    // Use openssl to parse certificate details
    const decoded = execSync(`echo "${pem}" | openssl x509 -noout -subject -issuer -dates -fingerprint -ext subjectAltName 2>/dev/null`, {
      encoding: 'utf-8',
    });

    // Parse subject
    const subjectMatch = decoded.match(/subject=(.+)/);
    if (subjectMatch) {
      result.subject = subjectMatch[1].trim();
    }

    // Parse issuer
    const issuerMatch = decoded.match(/issuer=(.+)/);
    if (issuerMatch) {
      result.issuer = issuerMatch[1].trim();
    }

    // Parse validity dates
    const notBeforeMatch = decoded.match(/notBefore=(.+)/);
    if (notBeforeMatch) {
      result.validFrom = notBeforeMatch[1].trim();
    }

    const notAfterMatch = decoded.match(/notAfter=(.+)/);
    if (notAfterMatch) {
      result.validTo = notAfterMatch[1].trim();
    }

    // Parse fingerprint
    const fingerprintMatch = decoded.match(/SHA1 Fingerprint=(.+)/);
    if (fingerprintMatch) {
      result.fingerprint = fingerprintMatch[1].trim();
    }

    // Parse SANs
    const sanMatch = decoded.match(/X509v3 Subject Alternative Name:\s*\n\s*(.+)/);
    if (sanMatch) {
      result.sans = sanMatch[1].split(',').map((s) => s.trim().replace(/^DNS:/, ''));
    }
  } catch {
    // Parsing failed, return partial result
  }

  return result;
}

function pemToDer(pem: string): Buffer {
  // Remove PEM headers and decode base64
  const base64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/, '')
    .replace(/-----END CERTIFICATE-----/, '')
    .replace(/\s/g, '');

  return Buffer.from(base64, 'base64');
}

export function formatCertCollectOutput(result: CertCollectResult, verbose: boolean): string {
  const lines: string[] = [];

  lines.push('Certificate Collection Results');
  lines.push('==============================');
  lines.push('');

  lines.push(`Host: ${result.hostname}:${result.port}`);
  lines.push(`Certificates found: ${result.certificates.length}`);
  lines.push('');

  if (result.error) {
    lines.push(`Error: ${result.error}`);
    return lines.join('\n');
  }

  for (let i = 0; i < result.certificates.length; i++) {
    const cert = result.certificates[i];
    const label = i === 0 ? 'Server Certificate' : `Intermediate Certificate ${i}`;

    lines.push(`${label}:`);
    lines.push(`  Subject: ${cert.subject}`);
    lines.push(`  Issuer:  ${cert.issuer}`);

    if (verbose) {
      lines.push(`  Valid From: ${cert.validFrom}`);
      lines.push(`  Valid To:   ${cert.validTo}`);

      if (cert.fingerprint) {
        lines.push(`  SHA1 Fingerprint: ${cert.fingerprint}`);
      }

      if (cert.sans && cert.sans.length > 0) {
        lines.push(`  Subject Alternative Names:`);
        for (const san of cert.sans) {
          lines.push(`    - ${san}`);
        }
      }
    }

    lines.push('');
  }

  if (result.savedFiles.length > 0) {
    lines.push('Saved Files:');
    for (const file of result.savedFiles) {
      lines.push(`  - ${file}`);
    }
  }

  return lines.join('\n');
}
