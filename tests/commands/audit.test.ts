import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  appendFileSync,
  readFileSync,
} from "fs";

// Mock modules
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  appendFileSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("os", () => ({
  homedir: () => "/mock/home",
}));

vi.mock("../../src/utils/env.js", () => ({
  env: {
    logPath: "/mock/logs",
    auditFormat: "json",
  },
}));

import {
  audit,
  logAuditEntry,
  isAuditActive,
  AuditCommand,
  AuditOptions,
  AuditLogEntry,
} from "../../src/commands/audit.js";

describe("audit command", () => {
  const mockExistsSync = vi.mocked(existsSync);
  const mockMkdirSync = vi.mocked(mkdirSync);
  const mockWriteFileSync = vi.mocked(writeFileSync);
  const mockAppendFileSync = vi.mocked(appendFileSync);
  const mockReadFileSync = vi.mocked(readFileSync);

  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    // Reset audit state by stopping if active
    if (isAuditActive()) {
      audit("off");
    }
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Ensure audit is stopped after each test
    if (isAuditActive()) {
      audit("off");
    }
  });

  describe("audit on", () => {
    it("should start audit logging", async () => {
      const result = await audit("on");

      expect(result.success).toBe(true);
      expect(result.message).toContain("Audit logging started");
      expect(result.state?.active).toBe(true);
      expect(result.state?.logFile).toContain("audit-");
    });

    it("should create log directory if missing", async () => {
      mockExistsSync.mockReturnValue(false);

      await audit("on", { output: "/new/log/dir" });

      expect(mockMkdirSync).toHaveBeenCalledWith("/new/log/dir", {
        recursive: true,
      });
    });

    it("should fail if audit is already active", async () => {
      await audit("on");
      const result = await audit("on");

      expect(result.success).toBe(false);
      expect(result.message).toContain("already active");
    });

    it("should initialize JSON format correctly", async () => {
      await audit("on", { format: "json" });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".json"),
        "[\n",
      );
    });

    it("should initialize Markdown format correctly", async () => {
      await audit("on", { format: "markdown" });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".md"),
        expect.stringContaining("# Audit Log"),
      );
    });

    it("should initialize text format correctly", async () => {
      await audit("on", { format: "text" });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".txt"),
        expect.stringContaining("Audit Log - Started"),
      );
    });
  });

  describe("audit off", () => {
    it("should stop audit logging", async () => {
      await audit("on");
      const result = await audit("off");

      expect(result.success).toBe(true);
      expect(result.message).toContain("stopped");
      expect(isAuditActive()).toBe(false);
    });

    it("should finalize JSON file", async () => {
      await audit("on", { format: "json" });
      await audit("off");

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".json"),
        "\n]",
      );
    });

    it("should finalize Markdown file", async () => {
      await audit("on", { format: "markdown" });
      await audit("off");

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".md"),
        expect.stringContaining("Ended:"),
      );
    });

    it("should fail if audit is not active", async () => {
      const result = await audit("off");

      expect(result.success).toBe(false);
      expect(result.message).toContain("not active");
    });

    it("should report entry count and duration", async () => {
      await audit("on");
      // Simulate some entries
      logAuditEntry({
        timestamp: new Date().toISOString(),
        action: "test",
        success: true,
      });
      const result = await audit("off");

      expect(result.message).toMatch(/\d+ entries logged/);
    });
  });

  describe("audit status", () => {
    it("should report inactive status", async () => {
      const result = await audit("status");

      expect(result.success).toBe(true);
      expect(result.message).toContain("not active");
    });

    it("should report active status with details", async () => {
      await audit("on");
      const result = await audit("status");

      expect(result.success).toBe(true);
      expect(result.message).toContain("active");
      expect(result.message).toContain("Log file:");
      expect(result.state?.active).toBe(true);
    });
  });

  describe("audit export", () => {
    it("should fail if no active session", async () => {
      const result = await audit("export");

      expect(result.success).toBe(false);
      expect(result.message).toContain("No active audit session");
    });

    it("should return current file if format matches", async () => {
      await audit("on", { format: "json" });
      const result = await audit("export", { format: "json" });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Current log file");
    });

    it("should export to different format", async () => {
      await audit("on", { format: "json" });
      mockReadFileSync.mockReturnValue("[]");

      const result = await audit("export", {
        format: "markdown",
        output: "/export/dir",
      });

      expect(result.success).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledTimes(2); // Initial + export
    });
  });

  describe("logAuditEntry()", () => {
    it("should not log when audit is inactive", async () => {
      logAuditEntry({
        timestamp: new Date().toISOString(),
        action: "test",
        success: true,
      });

      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });

    it("should log entry in JSON format", async () => {
      await audit("on", { format: "json" });

      logAuditEntry({
        timestamp: "2024-01-01T00:00:00.000Z",
        action: "test-action",
        success: true,
        agent: "coder",
      });

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"action": "test-action"'),
      );
    });

    it("should log entry in Markdown format", async () => {
      await audit("on", { format: "markdown" });

      logAuditEntry({
        timestamp: "2024-01-01T00:00:00.000Z",
        action: "test-action",
        success: true,
      });

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("**Action:** test-action"),
      );
    });

    it("should log entry in text format", async () => {
      await audit("on", { format: "text" });

      logAuditEntry({
        timestamp: "2024-01-01T00:00:00.000Z",
        action: "test-action",
        success: true,
      });

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("[2024-01-01T00:00:00.000Z] test-action"),
      );
    });

    it("should include all optional fields", async () => {
      await audit("on", { format: "json" });

      const entry: AuditLogEntry = {
        timestamp: "2024-01-01T00:00:00.000Z",
        action: "test-action",
        success: true,
        agent: "coder",
        skill: "code-review",
        tool: "github",
        duration_ms: 1500,
        error: undefined,
      };

      logAuditEntry(entry);

      const appendCall = mockAppendFileSync.mock.calls.find(
        (call) =>
          typeof call[1] === "string" && call[1].includes("test-action"),
      );
      expect(appendCall).toBeDefined();
      const logContent = appendCall?.[1] as string;
      expect(logContent).toContain('"agent": "coder"');
      expect(logContent).toContain('"skill": "code-review"');
    });
  });

  describe("isAuditActive()", () => {
    it("should return false when not started", () => {
      expect(isAuditActive()).toBe(false);
    });

    it("should return true when started", async () => {
      await audit("on");
      expect(isAuditActive()).toBe(true);
    });

    it("should return false after stopped", async () => {
      await audit("on");
      await audit("off");
      expect(isAuditActive()).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should handle directory creation failure", async () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const result = await audit("on", { output: "/readonly/dir" });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to create log directory");
    });

    it("should handle file creation failure", async () => {
      mockWriteFileSync.mockImplementation(() => {
        throw new Error("Disk full");
      });

      const result = await audit("on");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to create log file");
    });

    it("should handle unknown command", async () => {
      const result = await audit("invalid" as AuditCommand);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Unknown audit command");
    });
  });
});
