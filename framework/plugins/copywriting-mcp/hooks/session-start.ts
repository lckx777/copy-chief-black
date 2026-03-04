#!/usr/bin/env bun
/**
 * Session Start Hook
 *
 * Executa no início de cada sessão Claude Code.
 * Implementa context injection automático.
 *
 * Funções:
 * 1. Detectar oferta ativa
 * 2. Determinar fase HELIX atual
 * 3. Carregar contexto apropriado
 * 4. Injetar via stderr
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { glob } from "glob";

interface OfferInfo {
  path: string;
  name: string;
  nicho: string;
  phase: number;
  lastModified: Date;
}

/**
 * Detect active offers in the ecosystem
 */
async function detectActiveOffers(): Promise<OfferInfo[]> {
  const ecosystemBase = process.env.COPYWRITING_ECOSYSTEM || path.join(process.env.HOME || "~", "copywriting-ecosystem");

  if (!existsSync(ecosystemBase)) {
    return [];
  }

  const offers: OfferInfo[] = [];

  // Find all task_plan.md files (indicates active offer)
  const taskPlans = await glob(path.join(ecosystemBase, "**/task_plan.md"));

  for (const taskPlan of taskPlans) {
    const offerDir = path.dirname(taskPlan);
    const relativePath = path.relative(ecosystemBase, offerDir);
    const parts = relativePath.split(path.sep);

    if (parts.length < 2) continue;

    const nicho = parts[0];
    const offerName = parts[1];

    // Determine current phase from progress files
    let currentPhase = 1;

    // Check briefing phases
    for (let i = 10; i >= 1; i--) {
      const phasePath = path.join(offerDir, "briefings/phases", `fase-${i.toString().padStart(2, "0")}.md`);
      if (existsSync(phasePath)) {
        const stats = statSync(phasePath);
        const content = readFileSync(phasePath, "utf-8");
        // Check if phase has meaningful content (>100 words)
        if (content.split(/\s+/).length > 100) {
          currentPhase = i + 1;
          break;
        }
      }
    }

    // Check research completion
    const synthesisPath = path.join(offerDir, "research/synthesis.md");
    if (!existsSync(synthesisPath)) {
      currentPhase = Math.min(currentPhase, 4); // Still in research
    }

    const stats = statSync(taskPlan);

    offers.push({
      path: relativePath,
      name: offerName,
      nicho,
      phase: Math.min(currentPhase, 10),
      lastModified: stats.mtime,
    });
  }

  // Sort by last modified (most recent first)
  return offers.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

/**
 * Load context summary for an offer
 */
function loadContextSummary(offerPath: string): string {
  const ecosystemBase = process.env.COPYWRITING_ECOSYSTEM || path.join(process.env.HOME || "~", "copywriting-ecosystem");
  const offerDir = path.join(ecosystemBase, offerPath);

  let context = "";

  // Try to load CONTEXT.md
  const contextPath = path.join(offerDir, "CONTEXT.md");
  if (existsSync(contextPath)) {
    const content = readFileSync(contextPath, "utf-8");
    // Take first 500 tokens approx
    context += content.substring(0, 2000);
  }

  // Try to load synthesis.md summary
  const synthesisPath = path.join(offerDir, "research/synthesis.md");
  if (existsSync(synthesisPath)) {
    const content = readFileSync(synthesisPath, "utf-8");
    // Extract key decisions (usually at top)
    const keySection = content.substring(0, 1500);
    context += "\n\n## Síntese\n" + keySection;
  }

  return context;
}

/**
 * Generate phase guidance
 */
function getPhaseGuidance(phase: number): string {
  const guidance: Record<number, string> = {
    1: "Discovery - Usar get_phase_context para carregar contexto inicial",
    2: "Ads Library - Usar fb_ad_library MCP para pesquisa de concorrentes",
    3: "VOC - Usar voc_search para buscar quotes por emoção",
    4: "Mechanism - Pesquisar estudos e validar claims científicos",
    5: "MUP/MUS - CRÍTICO: Usar blind_critic e emotional_stress_test",
    6: "DRE - Construir One Belief e oferta completa",
    7: "Narrative - Mapear jornada do herói e momentos emocionais",
    8: "Elements - Definir provas, autoridade, urgência",
    9: "Review - Usar layered_review (3 camadas) + copy-critic",
    10: "Production - Usar write_chapter para cada capítulo",
  };

  return guidance[phase] || "Verificar estado com validate_gate";
}

/**
 * Main hook execution
 */
async function main() {
  try {
    const offers = await detectActiveOffers();

    if (offers.length === 0) {
      // No active offers - just output minimal context
      console.error(`[copywriting-mcp] Nenhuma oferta ativa detectada.
Use "ecosystem-guide" para criar nova oferta.`);
      return;
    }

    // Build context injection
    let injection = `[copywriting-mcp] Ofertas Ativas

`;

    // List all offers with status
    for (const offer of offers.slice(0, 5)) {
      const phaseGuidance = getPhaseGuidance(offer.phase);
      injection += `• ${offer.name} (${offer.nicho}) - Fase ${offer.phase}: ${phaseGuidance}
`;
    }

    // If there's a most recent offer, load more context
    const mostRecent = offers[0];
    if (mostRecent) {
      injection += `
---

## Oferta Mais Recente: ${mostRecent.name}

**Fase atual:** ${mostRecent.phase}/10 - ${getPhaseGuidance(mostRecent.phase)}

### Tools Recomendados

| Tool | Quando usar |
|------|-------------|
| get_phase_context | Carregar contexto da fase atual |
| validate_gate | Verificar se pode avançar |
| voc_search | Buscar VOC por emoção |
| blind_critic | Avaliar copy sem contexto |
| emotional_stress_test | Validar ressonância emocional |
| write_chapter | Escrever por capítulos |
| layered_review | Revisar em 3 camadas |

Para trabalhar nesta oferta:
\`get_phase_context phase=${mostRecent.phase} offer_path="${mostRecent.path}"\`
`;

      // Add brief context summary
      const summary = loadContextSummary(mostRecent.path);
      if (summary) {
        injection += `
### Contexto Resumido

${summary.substring(0, 1000)}...
`;
      }
    }

    // Output via stderr for Claude to see
    console.error(injection);

  } catch (error) {
    console.error(`[copywriting-mcp] Erro no session-start: ${error}`);
  }
}

main();
