{
  "respectGitignore": true,
  "cleanupPeriodDays": 14,
  "env": {
    "ENABLE_TOOL_SEARCH": "auto:5",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "80",
    "BASH_MAX_OUTPUT_LENGTH": "100000",
    "PATH": "{{PATH}}"
  },
  "attribution": {
    "commit": "Copy Chief: \n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>",
    "pr": "Copy Chief - Generated with Claude Code"
  },
  "permissions": {
    "allow": [
      "Edit(.claude/approved-plans/**)",
      "Read",
      "Write",
      "Edit",
      "Bash",
      "WebFetch",
      "WebSearch",
      "Task",
      "Glob",
      "Grep",
      "NotebookEdit",
      "Bash(git pull:*)",
      "Skill(*)",
      "mcp__*"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(rm -rf ~)",
      "Bash(rm -rf /*)",
      "Bash(sudo rm -rf:*)",
      "Bash(mkfs:*)",
      "Bash(dd if=/dev/zero:*)",
      "Bash(chmod -R 777 /)"
    ]
  },
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/synapse-engine.cjs", "timeout": 15 }
        ]
      }
    ]
  },
  "enabledPlugins": {
    "planning-with-files@planning-with-files": true
  },
  "outputStyle": "default",
  "language": "pt-br",
  "sandbox": {
    "enabled": false
  },
  "skipDangerousModePermissionPrompt": true,
  "effortLevel": "high"
}
