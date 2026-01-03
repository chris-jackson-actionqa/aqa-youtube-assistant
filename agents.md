# Agent Guidelines

- Never use `--no-verify` when committing unless the user explicitly instructs you to do so for that specific commit.
- Always run the full pre-commit stack and required test suites before committing changes, unless the user explicitly waives them.
- If any hook or test fails, stop and report the failure with details; do not bypass or skip checks.
- When in doubt about committing, ask the user for clarification rather than proceeding with shortcuts.
- Never lower code coverage thresholds without explicit user permission. If coverage drops, fix the code or tests to maintain the established quality standards.
