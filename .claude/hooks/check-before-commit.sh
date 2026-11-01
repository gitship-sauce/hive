#!/bin/bash
# Runs before every Bash command Claude wants to run. Lets everything through except
# "git commit", which only goes ahead when every test passes (CLAUDE.md: tick [x] only when everything is green).
# Every failure below exits 2: any other exit code lets the command go ahead.
#
# Test it by hand from the project folder (2 = blocked, 0 = allowed):
#   echo '{"tool_input":{"command":"git commit -m test"}}' | .claude/hooks/check-before-commit.sh; echo $?

INPUT=$(cat)
if command -v jq > /dev/null; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
else
  # Without jq, match against the raw JSON, so a commit is still caught.
  COMMAND=$INPUT
fi

# Catches "git commit", "git -C dir commit", "git --no-pager commit" and "bash -c 'git commit'".
if [[ ! "$COMMAND" =~ (^|[;&|\(\`\"\'/[:space:]])git([[:space:]]+(-[Cc][[:space:]]+[^[:space:]]+|-[^[:space:]]+))*[[:space:]]+commit ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || { echo "Blocked: can't find the project folder to run the tests." >&2; exit 2; }
if ! npm run check > /tmp/hive-check.log 2>&1; then
  echo "Blocked: npm run check failed, so this can't be committed. Fix it first. Output: /tmp/hive-check.log" >&2
  exit 2
fi
if ! npm run e2e > /tmp/hive-e2e.log 2>&1; then
  echo "Blocked: a browser test failed, so this can't be committed. Fix it first. Output: /tmp/hive-e2e.log" >&2
  exit 2
fi
exit 0
