import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

// Mock modules before importing the command
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("os", () => ({
  homedir: () => "/mock/home",
}));

// Import after mocks are set up
import {
  gitconfig,
  formatGitConfigOutput,
  GitConfigOptions,
} from "../../src/commands/gitconfig.js";

describe("gitconfig command", () => {
  const mockExecSync = vi.mocked(execSync);
  const mockExistsSync = vi.mocked(existsSync);
  const mockReadFileSync = vi.mocked(readFileSync);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: config file exists
    mockExistsSync.mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("gitconfig()", () => {
    it("should return basic git config values", async () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("user.name")) return "Test User\n";
        if (cmd.includes("user.email")) return "test@example.com\n";
        if (cmd.includes("core.editor")) return "vim\n";
        if (cmd.includes("init.defaultBranch")) return "main\n";
        if (cmd.includes("credential.helper")) return "osxkeychain\n";
        throw new Error("Config not found");
      });
      mockReadFileSync.mockReturnValue("");

      const result = await gitconfig();

      expect(result.user.name).toBe("Test User");
      expect(result.user.email).toBe("test@example.com");
      expect(result.core.editor).toBe("vim");
      expect(result.init.defaultBranch).toBe("main");
      expect(result.credential.helper).toBe("osxkeychain");
    });

    it("should return undefined for missing config values", async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("Config not found");
      });
      mockReadFileSync.mockReturnValue("");

      const result = await gitconfig();

      expect(result.user.name).toBeUndefined();
      expect(result.user.email).toBeUndefined();
      expect(result.core.editor).toBeUndefined();
    });

    it("should include aliases and all entries in verbose mode", async () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes("user.name")) return "Test User\n";
        if (cmd.includes("user.email")) return "test@example.com\n";
        if (cmd.includes("--list --show-origin")) {
          return "file:/mock/home/.gitconfig\tuser.name=Test User\nfile:/mock/home/.gitconfig\tuser.email=test@example.com\n";
        }
        if (cmd.includes("--get-regexp")) {
          return "alias.co checkout\nalias.br branch\n";
        }
        throw new Error("Config not found");
      });
      mockReadFileSync.mockReturnValue("");

      const result = await gitconfig({ verbose: true });

      expect(result.aliases).toBeDefined();
      expect(result.aliases?.co).toBe("checkout");
      expect(result.aliases?.br).toBe("branch");
      expect(result.allEntries).toBeDefined();
      expect(result.allEntries?.length).toBeGreaterThan(0);
    });

    it("should parse includes from config file", async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("Config not found");
      });
      mockReadFileSync.mockReturnValue(`
[include]
    path = ~/.gitconfig-work

[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work-specific
`);

      const result = await gitconfig();

      expect(result.includes).toBeDefined();
      expect(result.includes?.length).toBe(2);
      expect(result.includes?.[0].path).toBe("~/.gitconfig-work");
      expect(result.includes?.[1].path).toBe("~/.gitconfig-work-specific");
      expect(result.includes?.[1].condition).toBe("gitdir:~/work/");
    });
  });

  describe("formatGitConfigOutput()", () => {
    it("should format basic output", () => {
      const result = {
        user: { name: "Test User", email: "test@example.com" },
        core: { editor: "vim" },
        init: { defaultBranch: "main" },
        credential: { helper: "osxkeychain" },
        includes: [],
      };

      const output = formatGitConfigOutput(result, false);

      expect(output).toContain("Git Configuration");
      expect(output).toContain("Test User");
      expect(output).toContain("test@example.com");
      expect(output).toContain("vim");
      expect(output).toContain("main");
    });

    it("should show (not set) for missing values", () => {
      const result = {
        user: {},
        core: {},
        init: {},
        credential: {},
        includes: [],
      };

      const output = formatGitConfigOutput(result, false);

      expect(output).toContain("(not set)");
    });

    it("should include aliases in verbose output", () => {
      const result = {
        user: { name: "Test User" },
        core: {},
        init: {},
        credential: {},
        includes: [],
        aliases: { co: "checkout", br: "branch" },
        allEntries: [],
      };

      const output = formatGitConfigOutput(result, true);

      expect(output).toContain("Aliases:");
      expect(output).toContain("co = checkout");
      expect(output).toContain("br = branch");
    });

    it("should format includes with conditions", () => {
      const result = {
        user: {},
        core: {},
        init: {},
        credential: {},
        includes: [
          { path: "~/.gitconfig-work" },
          { path: "~/.gitconfig-work-specific", condition: "gitdir:~/work/" },
        ],
      };

      const output = formatGitConfigOutput(result, false);

      expect(output).toContain("Includes:");
      expect(output).toContain("~/.gitconfig-work");
      expect(output).toContain("[if gitdir:~/work/]");
    });
  });
});
