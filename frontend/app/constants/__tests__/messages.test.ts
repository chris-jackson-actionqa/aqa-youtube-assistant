import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../messages";

describe("Error Messages Constants", () => {
  describe("ERROR_MESSAGES", () => {
    it("should have all required error message keys", () => {
      expect(ERROR_MESSAGES).toHaveProperty("LOAD_TEMPLATES");
      expect(ERROR_MESSAGES).toHaveProperty("APPLY_TEMPLATE");
      expect(ERROR_MESSAGES).toHaveProperty("LOAD_PROJECTS");
      expect(ERROR_MESSAGES).toHaveProperty("DELETE_PROJECT");
      expect(ERROR_MESSAGES).toHaveProperty("LOAD_PROJECT");
      expect(ERROR_MESSAGES).toHaveProperty("REFRESH_PROJECT");
      expect(ERROR_MESSAGES).toHaveProperty("LOAD_WORKSPACES");
      expect(ERROR_MESSAGES).toHaveProperty("CREATE_WORKSPACE");
      expect(ERROR_MESSAGES).toHaveProperty("UPDATE_WORKSPACE");
      expect(ERROR_MESSAGES).toHaveProperty("DELETE_WORKSPACE");
      expect(ERROR_MESSAGES).toHaveProperty("REFRESH_WORKSPACES");
    });

    it("should have all error messages as non-empty strings", () => {
      Object.entries(ERROR_MESSAGES).forEach(([key, message]) => {
        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it("should have consistent message format", () => {
      Object.entries(ERROR_MESSAGES).forEach(([key, message]) => {
        // All error messages should start with an uppercase letter and end with a period
        expect(message[0]).toBe(message[0].toUpperCase());
        expect(message.endsWith(".")).toBe(true);
      });
    });

    describe("LOAD_TEMPLATES", () => {
      it("should have descriptive message", () => {
        expect(ERROR_MESSAGES.LOAD_TEMPLATES).toBe(
          "Unable to load templates. Please try again."
        );
      });
    });

    describe("APPLY_TEMPLATE", () => {
      it("should have descriptive message", () => {
        expect(ERROR_MESSAGES.APPLY_TEMPLATE).toBe(
          "Failed to apply template. Please try again."
        );
      });
    });

    describe("LOAD_PROJECTS", () => {
      it("should have descriptive message", () => {
        expect(ERROR_MESSAGES.LOAD_PROJECTS).toBe(
          "Failed to load projects. Please try again."
        );
      });
    });

    describe("DELETE_PROJECT", () => {
      it("should have descriptive message", () => {
        expect(ERROR_MESSAGES.DELETE_PROJECT).toBe(
          "Failed to delete project. Please try again."
        );
      });
    });

    describe("LOAD_PROJECT", () => {
      it("should have descriptive message", () => {
        expect(ERROR_MESSAGES.LOAD_PROJECT).toBe(
          "Failed to load project. Please try again."
        );
      });
    });

    describe("REFRESH_PROJECT", () => {
      it("should have descriptive message", () => {
        expect(ERROR_MESSAGES.REFRESH_PROJECT).toBe(
          "Failed to refresh project. Please try again."
        );
      });
    });

    describe("LOAD_WORKSPACES", () => {
      it("should have descriptive message", () => {
        expect(ERROR_MESSAGES.LOAD_WORKSPACES).toBe(
          "Failed to load workspaces. Please try again."
        );
      });
    });

    describe("CREATE_WORKSPACE", () => {
      it("should have descriptive message", () => {
        expect(ERROR_MESSAGES.CREATE_WORKSPACE).toBe(
          "Failed to create workspace. Please try again."
        );
      });
    });

    describe("UPDATE_WORKSPACE", () => {
      it("should have descriptive message", () => {
        expect(ERROR_MESSAGES.UPDATE_WORKSPACE).toBe(
          "Failed to update workspace. Please try again."
        );
      });
    });

    describe("DELETE_WORKSPACE", () => {
      it("should have descriptive message", () => {
        expect(ERROR_MESSAGES.DELETE_WORKSPACE).toBe(
          "Failed to delete workspace. Please try again."
        );
      });
    });

    describe("REFRESH_WORKSPACES", () => {
      it("should have descriptive message", () => {
        expect(ERROR_MESSAGES.REFRESH_WORKSPACES).toBe(
          "Failed to refresh workspaces. Please try again."
        );
      });
    });
  });

  describe("SUCCESS_MESSAGES", () => {
    it("should have PROJECT_CREATED key", () => {
      expect(SUCCESS_MESSAGES).toHaveProperty("PROJECT_CREATED");
    });

    describe("PROJECT_CREATED", () => {
      it("should be a function", () => {
        expect(typeof SUCCESS_MESSAGES.PROJECT_CREATED).toBe("function");
      });

      it("should return formatted success message with project name", () => {
        const projectName = "My Test Project";
        const message = SUCCESS_MESSAGES.PROJECT_CREATED(projectName);
        expect(message).toBe(`Project "${projectName}" created successfully!`);
      });

      it("should work with different project names", () => {
        expect(SUCCESS_MESSAGES.PROJECT_CREATED("Project A")).toBe(
          'Project "Project A" created successfully!'
        );
        expect(SUCCESS_MESSAGES.PROJECT_CREATED("Test Project 123")).toBe(
          'Project "Test Project 123" created successfully!'
        );
      });

      it("should handle special characters in project name", () => {
        const projectName = "Project & Test's 2025";
        const message = SUCCESS_MESSAGES.PROJECT_CREATED(projectName);
        expect(message).toContain(projectName);
        expect(message).toContain("created successfully!");
      });

      it("should handle empty string project name", () => {
        const message = SUCCESS_MESSAGES.PROJECT_CREATED("");
        expect(message).toBe('Project "" created successfully!');
      });
    });
  });

  describe("Type safety", () => {
    it("should have all messages as literal string types", () => {
      // The 'as const' assertion ensures keys and values are literal types
      // TypeScript enforces this at compile time for type safety
      // Verify that the messages object contains expected keys with string values
      expect(typeof ERROR_MESSAGES.LOAD_TEMPLATES).toBe("string");
      expect(typeof ERROR_MESSAGES.APPLY_TEMPLATE).toBe("string");
      expect(typeof ERROR_MESSAGES.LOAD_PROJECTS).toBe("string");
    });

    it("should allow accessing messages by key", () => {
      const key: keyof typeof ERROR_MESSAGES = "LOAD_TEMPLATES";
      expect(ERROR_MESSAGES[key]).toBeDefined();
    });
  });
});
