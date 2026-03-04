#!/usr/bin/env bun
// ~/.claude/hooks/post-tool-use.ts
// Hook que rastreia leituras de arquivos - VERSÃO JARVIS (2026-01-30)
// Adicionado: Gate #6 - Anti-Homogeneização Check

import { recordFileRead, markPlanCreated, recordSequentialThinking } from '../.aios-core/copy-chief/state/session-state';
import { checkAntiHomogenization, CLICHES_BY_NICHE, BANNED_WORDS } from '../.aios-core/copy-chief/gates/production-gates';

interface PostToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: Record<string, unknown>;
}

function main(): void {
  try {
    const stdin = require('fs').readFileSync(0, 'utf8');
    const input: PostToolUseInput = JSON.parse(stdin);

    const toolName = input.tool_name;

    // Rastreia leituras
    if (['Read', 'View', 'Cat'].includes(toolName)) {
      const filePath =
        (input.tool_input?.file_path as string) ||
        (input.tool_input?.path as string) ||
        (input.tool_input?.file as string);

      if (filePath) {
        recordFileRead(filePath);
        console.error(`[SESSION] Arquivo registrado: ${filePath}`);
      }
    }

    // Detecta criação de plano
    if (['Write', 'Edit'].includes(toolName)) {
      const filePath =
        (input.tool_input?.file_path as string) ||
        (input.tool_input?.path as string);

      if (filePath && /PLAN|OUTLINE|STRATEGY/i.test(filePath)) {
        markPlanCreated();
        console.error(`[SESSION] Plano criado: ${filePath}`);
      }

      // Gate #5: Summary Token Validation
      if (filePath && filePath.endsWith('summary.md')) {
        const content = (input.tool_input?.content as string) ||
                       (input.tool_input?.new_string as string) || '';

        if (content) {
          const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
          const estimatedTokens = Math.ceil(wordCount * 1.3); // ~1.3 tokens/word for PT-BR

          if (estimatedTokens > 500) {
            console.error(`[WARN] Summary exceeds 500 tokens (~${estimatedTokens}). Consider trimming for RAG efficiency.`);
          }

          // Check required sections for research summaries
          const requiredSections = ['## Key Findings', '## Confidence', '## Quotes'];
          const missingSections = requiredSections.filter(s => !content.includes(s));

          if (missingSections.length > 0 && missingSections.length < requiredSections.length) {
            // Has some but not all - might be intentional structure
            console.error(`[INFO] Summary may be missing sections: ${missingSections.join(', ')}`);
          }
        }
      }

      // Gate #6: Anti-Homogeneização Check para arquivos de produção
      if (filePath && /production\/|criativo|headline|script|vsl/i.test(filePath)) {
        const content = (input.tool_input?.content as string) ||
                       (input.tool_input?.new_string as string) || '';

        if (content && content.length > 100) {
          // Detectar nicho do path
          const nicheMatch = filePath.match(/copywriting-ecosystem\/([^\/]+)\//);
          const nicheName = nicheMatch ? nicheMatch[1] : 'default';

          // Verificar clichês e palavras banidas
          const lowerContent = content.toLowerCase();
          const nicheCliches = CLICHES_BY_NICHE[nicheName] || [];
          const foundCliches = nicheCliches.filter(c => lowerContent.includes(c.toLowerCase()));
          const foundBanned = BANNED_WORDS.filter(w => lowerContent.includes(w.toLowerCase()));

          if (foundCliches.length > 0) {
            console.error(`[ANTI-HOMOG] ⚠️ CLICHÊS DETECTADOS: ${foundCliches.join(', ')}`);
            console.error(`[ANTI-HOMOG] Substitua por elementos ÚNICOS da oferta.`);
          }

          if (foundBanned.length > 0) {
            console.error(`[ANTI-HOMOG] ⚠️ PALAVRAS BANIDAS: ${foundBanned.join(', ')}`);
            console.error(`[ANTI-HOMOG] Use linguagem específica da VOC.`);
          }

          // Verificar elementos proprietários
          const hasProprietaryName = /método\s+[A-Z][a-zA-Z]+|sistema\s+[A-Z][a-zA-Z]+|protocolo\s+[A-Z][a-zA-Z]+/i.test(content);
          const hasSpecificNumbers = /\d{2,}%|\d{2,}\s*(dias|horas|minutos|pessoas|alunos)/i.test(content);

          if (!hasProprietaryName) {
            console.error(`[ANTI-HOMOG] ⚠️ Sem nome proprietário para método/sistema`);
          }

          if (!hasSpecificNumbers) {
            console.error(`[ANTI-HOMOG] ⚠️ Sem números específicos (%, dias, pessoas)`);
          }

          // Score de genericidade
          let genericityScore = 10;
          genericityScore -= foundCliches.length * 1.5;
          genericityScore -= foundBanned.length * 1.0;
          if (!hasProprietaryName) genericityScore -= 1.5;
          if (!hasSpecificNumbers) genericityScore -= 1.0;
          genericityScore = Math.max(0, Math.round(genericityScore));

          if (genericityScore < 8) {
            console.error(`[ANTI-HOMOG] ❌ GENERICIDADE SCORE: ${genericityScore}/10 (mínimo: 8)`);
            console.error(`[ANTI-HOMOG] Copy genérica demais - concorrente poderia usar sem alteração.`);
          } else {
            console.error(`[ANTI-HOMOG] ✅ Genericidade Score: ${genericityScore}/10`);
          }
        }
      }
    }

    // Detecta uso de Sequential Thinking MCP
    if (toolName.includes('sequential-thinking') || toolName.includes('sequentialthinking')) {
      recordSequentialThinking();
      console.error(`[SESSION] Sequential Thinking usado`);
    }

    // PostToolUse não bloqueia
    process.exit(0);

  } catch (error) {
    console.error(`[SESSION] Erro: ${error}`);
    process.exit(0);
  }
}

main();
