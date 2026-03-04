#!/usr/bin/env node
// memory-context.cjs - Exibe contexto recente de memória (v1.1)
// v1.1: BSSF Fix - Output para stderr, JSON para stdout

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const RLM_DIR = path.join(HOME, '.claude', 'rlm');

function display(msg) {
  process.stderr.write(msg + '\n');
}

display('# Memória Disponível');
display('');

// === RLM CHUNKS ===
display('## RLM Chunks Recentes');
const chunksDir = path.join(RLM_DIR, 'chunks');
if (fs.existsSync(chunksDir)) {
  let chunkFiles = [];
  try {
    chunkFiles = fs.readdirSync(chunksDir)
      .filter(f => f.endsWith('.md'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(chunksDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 5)
      .map(f => path.join(chunksDir, f.name));
  } catch (e) {
    chunkFiles = [];
  }

  if (chunkFiles.length > 0) {
    for (const chunkPath of chunkFiles) {
      const chunkName = path.basename(chunkPath, '.md');
      let summary = '';
      try {
        const lines = fs.readFileSync(chunkPath, 'utf8').split('\n').slice(0, 5);
        const match = lines.find(l => /^#|Summary:/.test(l));
        summary = match ? match.replace(/^# /, '').slice(0, 60) : '';
      } catch (e) {
        summary = '';
      }
      display(`- ${chunkName}: ${summary}...`);
    }
  } else {
    display('- Nenhum chunk encontrado');
  }
} else {
  display('- Diretório RLM não encontrado');
}
display('');

// === CLAUDE-MEM ===
display('## claude-mem');
display('- Status: Ativo (automático)');
display('- Observações carregadas no system-reminder');
display("- Use: mcp__plugin_claude-mem_mcp-search__search(query='...')");
display('');

// === INSTRUÇÕES ===
display('## Para Recuperar Contexto');
display('1. RLM: rlm_list_chunks() → rlm_peek(chunk_id)');
display('2. claude-mem: search(query) → get_observations(ids)');
display('');
display('Ver: ~/.claude/rules/memory-protocol.md');

// Resposta JSON para Claude Code (stdout)
process.stdout.write('{}');
