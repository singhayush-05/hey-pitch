import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateOrReservedIP, validateSafeUrl } from '../src/utils/ssrfGuard.js';
import { VerificationService } from '../src/services/verification.service.js';

describe('SSRF Guard & URL Verification Tests', () => {
  it('correctly identifies private and reserved IP addresses', () => {
    assert.equal(isPrivateOrReservedIP('127.0.0.1'), true, 'Loopback IPv4');
    assert.equal(isPrivateOrReservedIP('::1'), true, 'Loopback IPv6');
    assert.equal(isPrivateOrReservedIP('169.254.169.254'), true, 'Cloud metadata endpoint');
    assert.equal(isPrivateOrReservedIP('10.0.1.5'), true, '10.x.x.x private network');
    assert.equal(isPrivateOrReservedIP('172.16.0.1'), true, '172.16.x.x private network');
    assert.equal(isPrivateOrReservedIP('192.168.1.1'), true, '192.168.x.x private network');
    assert.equal(isPrivateOrReservedIP('8.8.8.8'), false, 'Public Google DNS');
  });

  it('rejects unsupported schemes (file, ftp, javascript)', async () => {
    const fileResult = await validateSafeUrl('file:///etc/passwd');
    assert.equal(fileResult.safe, false);
    assert.equal(fileResult.code, 'UNSUPPORTED_PROTOCOL');

    const ftpResult = await validateSafeUrl('ftp://drive.google.com/test');
    assert.equal(ftpResult.safe, false);
    assert.equal(ftpResult.code, 'UNSUPPORTED_PROTOCOL');
  });

  it('blocks localhost and internal domains directly (SSRF Protection)', async () => {
    const local1 = await validateSafeUrl('http://localhost:5000/api');
    assert.equal(local1.safe, false);
    assert.equal(local1.code, 'SSRF_BLOCKED');

    const local2 = await validateSafeUrl('http://127.0.0.1:8080/data');
    assert.equal(local2.safe, false);
    assert.equal(local2.code, 'UNSUPPORTED_PROVIDER');

    const meta = await validateSafeUrl('http://metadata.google.internal/computeMetadata');
    assert.equal(meta.safe, false);
    assert.equal(meta.code, 'SSRF_BLOCKED');
  });

  it('rejects unsupported domains not in whitelist', async () => {
    const evil = await validateSafeUrl('https://evil-hacker.com/video.mp4');
    assert.equal(evil.safe, false);
    assert.equal(evil.code, 'UNSUPPORTED_PROVIDER');
  });

  it('accepts supported providers (Google Drive, Dropbox, WeTransfer, Frame.io)', async () => {
    const drive = await VerificationService.validateUrl('https://drive.google.com/file/d/12345/view?usp=sharing');
    assert.equal(drive.isValidFormat, true);
    assert.equal(drive.provider, 'google_drive');

    const dropbox = await VerificationService.validateUrl('https://www.dropbox.com/s/abcdef12345/clip.mp4?dl=0');
    assert.equal(dropbox.isValidFormat, true);
    assert.equal(dropbox.provider, 'dropbox');

    const wetransfer = await VerificationService.validateUrl('https://we.tl/t-abc123xyz');
    assert.equal(wetransfer.isValidFormat, true);
    assert.equal(wetransfer.provider, 'wetransfer');

    const frameio = await VerificationService.validateUrl('https://app.frame.io/share/1234-5678');
    assert.equal(frameio.isValidFormat, true);
    assert.equal(frameio.provider, 'frame_io');
  });

  it('flags unshared URLs lacking public sharing parameters', async () => {
    const unsharedDrive = await VerificationService.checkResource('https://drive.google.com/file/d/12345/edit');
    assert.equal(unsharedDrive.verified, false);
    assert.equal(unsharedDrive.status, 'unauthorized');
  });

  it('flags Google Drive view-only links', async () => {
    const viewOnly = await VerificationService.checkResource('https://drive.google.com/file/d/12345/view');
    assert.equal(viewOnly.verified, false);
    assert.equal(viewOnly.status, 'view_only');
  });

  it('marks shared downloadable URLs as downloadable and accessible', async () => {
    const shared = await VerificationService.checkResource('https://drive.google.com/file/d/12345/view?usp=sharing');
    assert.equal(shared.verified, true);
    assert.equal(shared.isDownloadable, true);
    assert.equal(shared.status, 'download_accessible');
  });
});
