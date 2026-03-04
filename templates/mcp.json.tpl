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
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "{{FIRECRAWL_API_KEY}}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "fb_ad_library": {
      "command": "npx",
      "args": ["-y", "facebook-ads-library-mcp"],
      "env": {
        "SCRAPECREATORS_API_KEY": "{{SCRAPECREATORS_API_KEY}}"
      }
    },
    "zen": {
      "command": "npx",
      "args": ["-y", "zen-mcp-server"],
      "env": {
        "GEMINI_API_KEY": "{{GEMINI_API_KEY}}",
        "OPENAI_API_KEY": "{{OPENAI_API_KEY}}"
      }
    }
  }
}
