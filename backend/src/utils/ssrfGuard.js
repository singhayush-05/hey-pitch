import dns from 'dns/promises';
import { URL } from 'url';

/**
 * Supported cloud storage provider hostnames.
 */
export const SUPPORTED_HOSTS = [
  'drive.google.com',
  'docs.google.com',
  'dropbox.com',
  'www.dropbox.com',
  'wetransfer.com',
  'we.tl',
  'frame.io',
  'app.frame.io'
];

/**
 * Checks if an IP string belongs to private, loopback, or cloud-metadata ranges.
 */
export function isPrivateOrReservedIP(ip) {
  // IPv4 checks
  if (ip === '127.0.0.1' || ip === '0.0.0.0') return true;
  if (ip === '::1' || ip === '::') return true;

  // Cloud metadata endpoint
  if (ip === '169.254.169.254') return true;

  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
    const [b0, b1] = parts;
    // 10.0.0.0/8 (Private)
    if (b0 === 10) return true;
    // 172.16.0.0/12 (Private)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (b0 === 192 && b1 === 168) return true;
    // 127.0.0.0/8 (Loopback)
    if (b0 === 127) return true;
    // 169.254.0.0/16 (Link-local)
    if (b0 === 169 && b1 === 254) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Test networks)
    if (b0 === 192 && b1 === 0 && parts[2] === 2) return true;
    // 224.0.0.0/4 (Multicast)
    if (b0 >= 224) return true;
  }

  // IPv6 link-local and unique local
  const lower = ip.toLowerCase();
  if (lower.startsWith('fe80:') || lower.startsWith('fc00:') || lower.startsWith('fd00:')) {
    return true;
  }

  return false;
}

/**
 * Validates a submitted URL against schema, provider host whitelist, and SSRF restrictions.
 */
export async function validateSafeUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return {
      safe: false,
      reason: 'URL must be a non-empty string',
      code: 'INVALID_URL'
    };
  }

  let parsed;
  try {
    parsed = new URL(urlString.trim());
  } catch {
    return {
      safe: false,
      reason: 'Malformed URL format',
      code: 'MALFORMED_URL'
    };
  }

  // Only allow HTTP/HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      safe: false,
      reason: `Unsupported URL protocol '${parsed.protocol}'. Only http and https are allowed.`,
      code: 'UNSUPPORTED_PROTOCOL'
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and plain IP addresses directly
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname === 'metadata.google.internal') {
    return {
      safe: false,
      reason: 'Prohibited localhost or internal domain',
      code: 'SSRF_BLOCKED'
    };
  }

  // Check against supported cloud storage provider whitelist
  const isSupported = SUPPORTED_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h));
  if (!isSupported) {
    return {
      safe: false,
      reason: `Host '${hostname}' is not a supported file provider. Supported providers: Google Drive, Dropbox, WeTransfer, Frame.io.`,
      code: 'UNSUPPORTED_PROVIDER'
    };
  }

  // DNS resolution to ensure host does not point to internal/private IP
  try {
    const addresses = await dns.resolve(hostname);
    for (const addr of addresses) {
      if (isPrivateOrReservedIP(addr)) {
        return {
          safe: false,
          reason: `Resolved IP address '${addr}' points to a private or restricted network range.`,
          code: 'SSRF_BLOCKED'
        };
      }
    }
  } catch (dnsErr) {
    // If DNS resolution fails, host does not exist or network is offline
    return {
      safe: false,
      reason: `Could not resolve hostname '${hostname}': ${dnsErr.message}`,
      code: 'DNS_RESOLUTION_FAILED'
    };
  }

  return {
    safe: true,
    url: parsed.href,
    hostname,
    provider: detectProvider(hostname)
  };
}

export function detectProvider(hostname) {
  if (hostname.includes('google.com')) return 'google_drive';
  if (hostname.includes('dropbox.com')) return 'dropbox';
  if (hostname.includes('wetransfer.com') || hostname === 'we.tl') return 'wetransfer';
  if (hostname.includes('frame.io')) return 'frame_io';
  return 'unknown';
}
