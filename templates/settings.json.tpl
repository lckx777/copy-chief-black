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
    "commit": "Copy Chief: \n\nCo-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>",
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
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/synapse-engine.cjs", "timeout": 15 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/discover-offer-context.cjs $(pwd)", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/setup-environment.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/memory-context.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{CLAUDE_HOME}}/scripts/health-check.js", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/command-auto-discovery.js", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/helix-orchestrator-boot.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/data-lifecycle-hook.cjs", "timeout": 10 }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/detect-clear-protect.cjs", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/analyze-production-task.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/regra-2x-detector.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/memory-bracket-injector.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/decision-detector.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/pipeline-intent-detector.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/ops-commit-scanner.cjs", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/persona-detector.cjs", "timeout": 1 }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit|NotebookEdit",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/production-delegation-gate.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/story-required-gate.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/copy-version-backup.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/phase-gate.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/phase-advance-gate.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/pre-tool-use-gate.js", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/production-preflight.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/registry-check.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/mecanismo-validation.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/helix-phase-mecanismo.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/discovery-before-create.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/self-critique-preflight.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/template-header-validation.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/voc-naming-validator.js", "timeout": 2 }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/agent-authority-gate.cjs", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/filter-bash-output.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/validate-before-commit.js", "timeout": 20 }
        ]
      },
      {
        "matcher": "mcp__.*",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/mcp-query-validator.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/mcp-circuit-breaker-hook.cjs", "timeout": 3 }
        ]
      },
      {
        "matcher": "mcp__copywriting__validate_gate",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/tool-matrix-enforcer.js", "timeout": 5 }
        ]
      },
      {
        "matcher": "mcp__firecrawl__.*|mcp__apify__.*|mcp__playwright__.*",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/processing-check.js", "timeout": 2 }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/dashboard-emit.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/context-tracker.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/meta-prompt-reminder.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/mcp-circuit-breaker-hook.cjs", "timeout": 3 }
        ]
      },
      {
        "matcher": "Read",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-tool-use.js", "timeout": 5 }
        ]
      },
      {
        "matcher": "Agent",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/agent-memory-writeback.js", "timeout": 3 }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-tool-use.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/memory-auto-populate.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/copy-attribution.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/fidelity-check.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-production-validate.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/doc-rot-detector.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/ids-register.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/clickup-deliverable-sync.js", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/persuasion-flow-check.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/mermaid-auto-update.js", "timeout": 10 }
        ]
      },
      {
        "matcher": "mcp__sequential-thinking__.*",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-tool-use.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/record-tool-in-offer.js", "timeout": 5 }
        ]
      },
      {
        "matcher": "mcp__copywriting__blind_critic|mcp__copywriting__emotional_stress_test|mcp__copywriting__black_validation",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/agent-state-recorder.cjs", "timeout": 3 }
        ]
      },
      {
        "matcher": "mcp__copywriting__validate_gate|mcp__copywriting__black_validation",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/gate-tracker.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/ids-register.js", "timeout": 3 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/clickup-gate-sync.js", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-gate-auto-advance.js", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/suggestion-on-gate.js", "timeout": 5 }
        ]
      },
      {
        "matcher": "mcp__copywriting__.*",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-production-validate.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/record-tool-in-offer.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-mcp-mecanismo-update.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/journey-log.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/etl-voc-post.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-validation-feedback.js", "timeout": 5 }
        ]
      },
      {
        "matcher": "mcp__zen__.*",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-production-validate.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/record-tool-in-offer.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-mcp-mecanismo-update.js", "timeout": 5 }
        ]
      },
      {
        "matcher": "mcp__firecrawl__.*",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-production-validate.js", "timeout": 5 }
        ]
      },
      {
        "matcher": "mcp__fb_ad_library__.*",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-production-validate.js", "timeout": 5 }
        ]
      },
      {
        "matcher": "mcp__playwright__.*",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/post-production-validate.js", "timeout": 5 }
        ]
      },
      {
        "matcher": "mcp__apify__call-actor|mcp__apify__get-dataset-items|mcp__apify__get-actor-output",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/etl-voc-post.js", "timeout": 5 }
        ]
      },
      {
        "matcher": ".*",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/completion-verifier.js", "timeout": 5 }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "auto|manual",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/pre-compact-save.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/session-digest-save.js", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/precompact-session-digest.cjs", "timeout": 15 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/plan-session-guard.cjs", "timeout": 3 }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/sync-repos-on-stop.cjs", "timeout": 30 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/sync-site.cjs", "timeout": 30 }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/stop-copy-validation.js", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/tool-enforcement-gate.js", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/session-handoff.js", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/pipeline-enforcer.cjs", "timeout": 10 }
        ]
      }
    ],
    "PermissionRequest": [
      {
        "matcher": "Read",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/auto-approve-reads.cjs", "timeout": 5 }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": "Bash|WebFetch",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/log-tool-failure.cjs", "timeout": 5 }
        ]
      },
      {
        "matcher": "mcp__.*",
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/error-handler.js", "timeout": 10 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/gotcha-error-capture.js", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/mcp-circuit-breaker-hook.cjs", "timeout": 3 }
        ]
      }
    ],
    "SubagentStart": [
      {
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/subagent-start-log.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/agent-activation-hook.cjs", "timeout": 5 }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/subagent-stop-validate.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/handoff-validator-hook.cjs", "timeout": 5 },
          { "type": "command", "command": "{{NODE_BIN}} {{HOOKS_DIR}}/pipeline-state-projector.cjs", "timeout": 3 }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "{{NODE_BIN}} {{HOOKS_DIR}}/statusline.cjs"
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
