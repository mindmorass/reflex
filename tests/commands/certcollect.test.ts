import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";

// Mock modules
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock("os", () => ({
  homedir: () => "/mock/home",
}));

import {
  certcollect,
  formatCertCollectOutput,
  CertCollectOptions,
  CertCollectArgs,
} from "../../src/commands/certcollect.js";

const MOCK_PEM = `-----BEGIN CERTIFICATE-----
MIIDrzCCApegAwIBAgIQCDvgVpBCRrGhdWrJWZHHSjANBgkqhkiG9w0BAQsFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBD
QTAeFw0yMTA0MTQwMDAwMDBaFw0zMTA0MTMyMzU5NTlaME8xCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxKTAnBgNVBAMTIERpZ2lDZXJ0IFRMUyBS
U0EgU0hBMjU2IDIwMjAgQ0ExMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
-----END CERTIFICATE-----`;

describe("certcollect command", () => {
  const mockExecSync = vi.mocked(execSync);
  const mockExistsSync = vi.mocked(existsSync);
  const mockMkdirSync = vi.mocked(mkdirSync);
  const mockWriteFileSync = vi.mocked(writeFileSync);

  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("URL parsing", () => {
    it("should extract hostname from URL with https", async () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("s_client")) return MOCK_PEM;
        if (cmd.includes("x509"))
          return "subject=CN=example.com\nissuer=CN=DigiCert\nnotBefore=Jan 1 00:00:00 2024\nnotAfter=Jan 1 00:00:00 2025\n";
        return "";
      });

      const result = await certcollect({ url: "https://example.com/path" });

      expect(result.hostname).toBe("example.com");
    });

    it("should extract hostname from URL with port", async () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("s_client")) return MOCK_PEM;
        if (cmd.includes("x509"))
          return "subject=CN=example.com\nissuer=CN=DigiCert\n";
        return "";
      });

      const result = await certcollect({ url: "example.com:8443" });

      expect(result.hostname).toBe("example.com");
    });

    it("should extract hostname from plain domain", async () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("s_client")) return MOCK_PEM;
        if (cmd.includes("x509"))
          return "subject=CN=example.com\nissuer=CN=DigiCert\n";
        return "";
      });

      const result = await certcollect({ url: "example.com" });

      expect(result.hostname).toBe("example.com");
    });
  });

  describe("certificate collection", () => {
    it("should collect single certificate", async () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("s_client")) return MOCK_PEM;
        if (cmd.includes("x509")) {
          return "subject=CN=example.com\nissuer=CN=DigiCert\nnotBefore=Jan 1 00:00:00 2024\nnotAfter=Jan 1 00:00:00 2025\nSHA1 Fingerprint=AB:CD:EF\n";
        }
        return "";
      });

      const result = await certcollect({ url: "example.com" });

      expect(result.certificates.length).toBe(1);
      expect(result.certificates[0].subject).toContain("example.com");
      expect(result.certificates[0].pem).toContain("BEGIN CERTIFICATE");
    });

    it("should collect certificate chain with -c option", async () => {
      const chainPem = MOCK_PEM + "\n" + MOCK_PEM;
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("s_client") && cmd.includes("-showcerts"))
          return chainPem;
        if (cmd.includes("s_client")) return MOCK_PEM;
        if (cmd.includes("x509"))
          return "subject=CN=example.com\nissuer=CN=DigiCert\n";
        return "";
      });

      const result = await certcollect({ url: "example.com" }, { chain: true });

      expect(result.certificates.length).toBe(2);
    });

    it("should save files to output directory", async () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("s_client")) return MOCK_PEM;
        if (cmd.includes("x509"))
          return "subject=CN=example.com\nissuer=CN=DigiCert\n";
        return "";
      });

      const result = await certcollect(
        { url: "example.com" },
        { output: "/custom/output" },
      );

      expect(mockWriteFileSync).toHaveBeenCalled();
      expect(result.savedFiles.length).toBeGreaterThan(0);
      expect(result.savedFiles[0]).toContain("/custom/output");
    });

    it("should create output directory if it does not exist", async () => {
      mockExistsSync.mockReturnValue(false);
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("s_client")) return MOCK_PEM;
        if (cmd.includes("x509"))
          return "subject=CN=example.com\nissuer=CN=DigiCert\n";
        return "";
      });

      await certcollect({ url: "example.com" }, { output: "/new/dir" });

      expect(mockMkdirSync).toHaveBeenCalledWith("/new/dir", {
        recursive: true,
      });
    });

    it("should save in DER format when specified", async () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("s_client")) return MOCK_PEM;
        if (cmd.includes("x509"))
          return "subject=CN=example.com\nissuer=CN=DigiCert\n";
        return "";
      });

      const result = await certcollect(
        { url: "example.com" },
        { format: "der" },
      );

      expect(result.savedFiles.some((f) => f.endsWith(".der"))).toBe(true);
    });

    it("should save in both formats when specified", async () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("s_client")) return MOCK_PEM;
        if (cmd.includes("x509"))
          return "subject=CN=example.com\nissuer=CN=DigiCert\n";
        return "";
      });

      const result = await certcollect(
        { url: "example.com" },
        { format: "both" },
      );

      expect(result.savedFiles.some((f) => f.endsWith(".crt"))).toBe(true);
      expect(result.savedFiles.some((f) => f.endsWith(".der"))).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle connection failures", async () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("s_client")) {
          throw new Error("Connection refused");
        }
        return "";
      });

      const result = await certcollect({ url: "nonexistent.example.com" });

      expect(result.error).toBeDefined();
      expect(result.certificates.length).toBe(0);
    });

    it("should handle directory creation failure", async () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const result = await certcollect(
        { url: "example.com" },
        { output: "/readonly/dir" },
      );

      expect(result.error).toContain("Failed to create output directory");
    });
  });

  describe("formatCertCollectOutput()", () => {
    it("should format successful output", () => {
      const result = {
        hostname: "example.com",
        port: 443,
        certificates: [
          {
            subject: "CN=example.com",
            issuer: "CN=DigiCert",
            validFrom: "Jan 1 00:00:00 2024",
            validTo: "Jan 1 00:00:00 2025",
            pem: MOCK_PEM,
          },
        ],
        savedFiles: ["/mock/home/Desktop/example.com.crt"],
      };

      const output = formatCertCollectOutput(result, false);

      expect(output).toContain("Certificate Collection Results");
      expect(output).toContain("example.com:443");
      expect(output).toContain("Server Certificate");
      expect(output).toContain("CN=example.com");
    });

    it("should include verbose details", () => {
      const result = {
        hostname: "example.com",
        port: 443,
        certificates: [
          {
            subject: "CN=example.com",
            issuer: "CN=DigiCert",
            validFrom: "Jan 1 00:00:00 2024",
            validTo: "Jan 1 00:00:00 2025",
            fingerprint: "AB:CD:EF",
            sans: ["example.com", "www.example.com"],
            pem: MOCK_PEM,
          },
        ],
        savedFiles: [],
      };

      const output = formatCertCollectOutput(result, true);

      expect(output).toContain("Valid From");
      expect(output).toContain("Valid To");
      expect(output).toContain("SHA1 Fingerprint");
      expect(output).toContain("Subject Alternative Names");
      expect(output).toContain("www.example.com");
    });

    it("should display error message", () => {
      const result = {
        hostname: "example.com",
        port: 443,
        certificates: [],
        savedFiles: [],
        error: "Connection refused",
      };

      const output = formatCertCollectOutput(result, false);

      expect(output).toContain("Error: Connection refused");
    });
  });
});
