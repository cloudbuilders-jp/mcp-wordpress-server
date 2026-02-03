#!/bin/bash
# Validate Bash commands before execution
# Blocks dangerous commands that could cause data loss

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# List of dangerous patterns to block
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf /*"
  "rm -rf ~"
  "rm -rf \."
  "rm -rf \$HOME"
  "rm -rf \*"
  "git push.*--force.*main"
  "git push.*--force.*master"
  "git push -f.*main"
  "git push -f.*master"
  "git reset --hard origin"
  "git clean -fd"
  "> /dev/sd"
  "mkfs"
  "dd if="
  ":(){:|:&};:"
  "chmod -R 777"
  "npm publish"
  "curl.*\|.*bash"
  "wget.*\|.*bash"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: Dangerous command pattern detected: $pattern" >&2
    echo "Command was: $COMMAND" >&2
    exit 2
  fi
done

# Allow the command
exit 0
