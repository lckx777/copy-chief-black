{
  "$schema": "https://raw.githubusercontent.com/anthropics/claude-code/main/schemas/mcp.schema.json",
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "copywriting": {
      "command": "{{NODE_BIN}}",
      "args": ["{{CLAUDE_HOME}}/plugins/copywriting-mcp/src/server.js"],
      "env": {
        "COPYWRITING_ECOSYSTEM": "{{ECOSYSTEM_ROOT}}"
      }
    },
    "apify": {
      "command": "npx",
      "args": ["-y", "@apify/actors-mcp-server", "--tools", "actors,docs,experimental,runs,storage"],
      "env": {
        "APIFY_TOKEN": "{{APIFY_TOKEN}}"
      }
    }
  }
}
