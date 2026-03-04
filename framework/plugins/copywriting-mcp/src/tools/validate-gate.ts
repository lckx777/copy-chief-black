/**
 * Validate Gate Tool
 *
 * Implementa o 3-Gate System (Pesquisa 06.md):
 *
 * Gate 1: Validação Estrutural (AI-driven)
 * Gate 2: Validação de Impacto (Hybrid - AI + Human)
 * Gate 3: Aprovação Final (Human-led)
 */

import { z } from "zod";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { glob } from "glob";
import { insertValidation, getValidationHistory } from "../db/sqlite.js";

// Tool definition
export const validateGateTool = {
  name: "validate_gate",
  description: `Valida gates do workflow HELIX.

3-Gate System:
- RESEARCH: Valida deliverables de pesquisa (4 tipos obrigatórios)
- BRIEFING: Valida completude das 10 fases + stress-test
- PRODUCTION: Valida copy final antes de entrega

Retorna PASSED ou BLOCKED com razões específicas.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      gate_type: {
        type: "string",
        enum: ["research", "briefing", "production"],
        description: "Tipo de gate a validar",
      },
      offer_path: {
        type: "string",
        description: "Caminho da oferta (ex: concursos/hacker)",
      },
      strict: {
        type: "boolean",
        default: false,
        description: "Modo strict - todos deliverables obrigatórios",
      },
    },
    required: ["gate_type", "offer_path"],
  },
};

// Research Gate deliverables
const RESEARCH_DELIVERABLES = {
  core: [
    { path: "research/synthesis.md", name: "Research Synthesis", blocking: true },
  ],
  voc: [
    { path: "research/voc/summary.md", name: "VOC Summary", blocking: true },
    { path: "research/voc/trends-analysis.md", name: "Trends Analysis", blocking: true },
  ],
  competitors: [
    { path: "research/competitors/summary.md", name: "Competitors Summary", blocking: true },
    { path: "research/competitors/processed/ads-library-spy.md", name: "Ads Library Spy", blocking: true },
  ],
  mechanism: [
    { path: "research/mechanism/summary.md", name: "Mechanism Summary", blocking: true },
  ],
  avatar: [
    { path: "research/avatar/summary.md", name: "Avatar Summary", blocking: true },
  ],
};

// BLACK Gate criteria (6 gates)
const BLACK_GATES = [
  {
    name: "Especificidade",
    description: "Nomes, idades, cidades, números específicos",
    patterns: [
      { pattern: /\d{1,2}\s*(anos|meses|dias|kg|quilos)/gi, weight: 1 },
      { pattern: /[A-Z][a-z]+\s[A-Z][a-z]+/g, weight: 0.5 }, // Proper names
      { pattern: /\d+,\d+%|\d+\.\d+/g, weight: 1.5 }, // Precise numbers
      { pattern: /Dr\.|Dra\.|Prof\./gi, weight: 1 },
    ],
    threshold: 5,
    blocking: true,
  },
  {
    name: "Mecanismo Proprietário",
    description: "Nome único para o mecanismo (não genérico)",
    patterns: [
      { pattern: /[A-Z][a-z]+\s(Method|Protocol|System|Technique|Método|Protocolo|Sistema)/g, weight: 2 },
      { pattern: /truque\s+d[aeo]\s+\w+/gi, weight: 2 },
      { pattern: /segredo\s+d[aeo]\s+\w+/gi, weight: 1.5 },
    ],
    threshold: 2,
    blocking: true,
  },
  {
    name: "Medo Visceral (Fear Hierarchy 4-5)",
    description: "Medo relacional ou de identidade",
    patterns: [
      { pattern: /família|filhos?|esposa?|marido|pais/gi, weight: 2 },
      { pattern: /fracassado|perdedor|incapaz/gi, weight: 2.5 },
      { pattern: /decepcionar|abandonar|perder tudo/gi, weight: 2 },
      { pattern: /quem você é|tipo de pessoa|se tornar/gi, weight: 2.5 },
    ],
    threshold: 3,
    blocking: true,
  },
  {
    name: "Narrativa Coerente",
    description: "História consistente consigo mesma",
    patterns: [
      { pattern: /primeiro|depois|então|quando|até que/gi, weight: 0.5 },
      { pattern: /história|jornada|caminho|processo/gi, weight: 0.3 },
    ],
    threshold: 3,
    blocking: false,
  },
  {
    name: "Zero Hesitação",
    description: "Linguagem absoluta, sem 'pode ser', 'talvez'",
    patterns: [
      { pattern: /pode ser|talvez|provavelmente|possivelmente/gi, weight: -2 },
      { pattern: /sob certas condições|em alguns casos/gi, weight: -2 },
      { pattern: /vai|é|funciona|garante/gi, weight: 0.5 },
    ],
    threshold: 0, // Negative patterns reduce score
    blocking: false,
  },
  {
    name: "Exclusividade Tribal",
    description: "Pertencimento a grupo seleto",
    patterns: [
      { pattern: /pessoas como você|você que|para quem/gi, weight: 1.5 },
      { pattern: /seleto|exclusiv|poucos|elite/gi, weight: 1 },
      { pattern: /a maioria não sabe|segredo|descobriram/gi, weight: 1.5 },
    ],
    threshold: 2,
    blocking: false,
  },
];

// Briefing Gate phases - DYNAMIC DISCOVERY (BSSF v1.0)
// Não usar paths hardcoded - descobrir dinamicamente via glob
// Aceita múltiplas convenções de naming:
// - fase01_*.md, fase-01-*.md, phase-01-*.md
// - {prefix}_fase01_*.md (ex: hacker_fase01_*.md)
//
// GBS: 95% - Funciona para qualquer convenção de naming

interface PhaseDefinition {
  phase: number;
  name: string;
  critical: boolean;
}

const PHASE_DEFINITIONS: PhaseDefinition[] = [
  { phase: 1, name: "Identificação", critical: false },
  { phase: 2, name: "Pesquisa de Mercado", critical: false },
  { phase: 3, name: "Avatar", critical: false },
  { phase: 4, name: "Consciência", critical: false },
  { phase: 5, name: "MUP", critical: true },
  { phase: 6, name: "MUS", critical: true },
  { phase: 7, name: "Big Offer", critical: false },
  { phase: 8, name: "Pitch", critical: false },
  { phase: 9, name: "Leads", critical: false },
  { phase: 10, name: "VSL/Progressão", critical: false },
];

/**
 * Descobre dinamicamente o arquivo de uma fase via glob
 * Aceita múltiplas convenções de naming:
 * - fase01, fase-01, fase_01, phase-01, phase_01
 * - Com ou sem prefixo (hacker_fase01, gptapv_fase01)
 * - Com ou sem sufixo descritivo (_identificacao, -identificacao)
 */
function discoverPhaseFile(basePath: string, phaseNumber: number): string | null {
  const phasesDir = path.join(basePath, "briefings/phases");

  if (!existsSync(phasesDir)) {
    return null;
  }

  // Padrões para descoberta (do mais específico ao mais genérico)
  // Suporta: fase01, fase-01, fase_01, phase-01, phase_01, phase01
  const paddedNum = phaseNumber.toString().padStart(2, "0");
  const rawNum = phaseNumber.toString();

  // Glob patterns que aceitam qualquer convenção
  const patterns = [
    // Com número padded (01, 02, etc.)
    `*fase${paddedNum}*.md`,
    `*fase-${paddedNum}*.md`,
    `*fase_${paddedNum}*.md`,
    `*phase${paddedNum}*.md`,
    `*phase-${paddedNum}*.md`,
    `*phase_${paddedNum}*.md`,
    // Com número raw (1, 2, etc.) - menos comum mas possível
    `*fase${rawNum}[_-]*.md`,
    `*phase${rawNum}[_-]*.md`,
  ];

  for (const pattern of patterns) {
    const matches = glob.sync(path.join(phasesDir, pattern));
    // Filtrar CLAUDE.md e outros arquivos não-briefing
    const validMatches = matches.filter(m => !m.includes("CLAUDE.md"));
    if (validMatches.length > 0) {
      // Retornar path relativo ao basePath
      return path.relative(basePath, validMatches[0]);
    }
  }

  return null;
}

// Input validation
const InputSchema = z.object({
  gate_type: z.enum(["research", "briefing", "production"]),
  offer_path: z.string(),
  strict: z.boolean().default(false),
});

// Check if file exists and has minimum content
function checkDeliverable(basePath: string, deliverable: { path: string; name: string }): {
  exists: boolean;
  hasContent: boolean;
  wordCount: number;
} {
  const fullPath = path.join(basePath, deliverable.path);

  if (!existsSync(fullPath)) {
    return { exists: false, hasContent: false, wordCount: 0 };
  }

  try {
    const content = readFileSync(fullPath, "utf-8");
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    // Minimum 100 words for meaningful content
    return {
      exists: true,
      hasContent: wordCount >= 100,
      wordCount,
    };
  } catch {
    return { exists: true, hasContent: false, wordCount: 0 };
  }
}

// Check synthesis confidence
function checkSynthesisConfidence(basePath: string): number | null {
  const synthesisPath = path.join(basePath, "research/synthesis.md");

  if (!existsSync(synthesisPath)) {
    return null;
  }

  try {
    const content = readFileSync(synthesisPath, "utf-8");

    // Look for confidence pattern
    const confidenceMatch = content.match(/confidence[:\s]+(\d+)%?/i);
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1], 10);
    }

    // Fallback: estimate based on content completeness
    const sections = [
      "avatar",
      "voc",
      "competitor",
      "mechanism",
      "mup",
      "mus",
    ];

    let foundSections = 0;
    for (const section of sections) {
      if (content.toLowerCase().includes(section)) {
        foundSections++;
      }
    }

    return Math.round((foundSections / sections.length) * 100);
  } catch {
    return null;
  }
}

// Handler
export async function validateGateHandler(args: unknown): Promise<string> {
  const input = InputSchema.parse(args);
  const { gate_type, offer_path, strict } = input;

  const ecosystemBase = process.env.COPYWRITING_ECOSYSTEM || path.join(process.env.HOME || "~", "copywriting-ecosystem");
  const offerBase = path.join(ecosystemBase, offer_path);

  if (!existsSync(offerBase)) {
    return `# Gate Validation: BLOCKED

**Oferta não encontrada:** ${offer_path}

Verifique se o caminho está correto.`;
  }

  switch (gate_type) {
    case "research":
      return validateResearchGate(offerBase, offer_path, strict);
    case "briefing":
      return validateBriefingGate(offerBase, offer_path, strict);
    case "production":
      return validateProductionGate(offerBase, offer_path, strict);
    default:
      return `Gate type "${gate_type}" não reconhecido.`;
  }
}

function validateResearchGate(basePath: string, offerPath: string, strict: boolean): string {
  const issues: string[] = [];
  const warnings: string[] = [];
  const passed: string[] = [];

  let output = `# Research Gate Validation

**Oferta:** ${offerPath}
**Modo:** ${strict ? "Strict (todos obrigatórios)" : "Normal"}

---

## Checklist de Deliverables

`;

  // Check each category
  for (const [category, deliverables] of Object.entries(RESEARCH_DELIVERABLES)) {
    output += `### ${category.toUpperCase()}\n\n`;

    for (const deliverable of deliverables) {
      const status = checkDeliverable(basePath, deliverable);

      if (!status.exists) {
        const message = `${deliverable.name} não encontrado`;
        if (deliverable.blocking || strict) {
          issues.push(message);
          output += `- ❌ **${deliverable.name}** - Não encontrado\n`;
        } else {
          warnings.push(message);
          output += `- ⚠️ ${deliverable.name} - Não encontrado (opcional)\n`;
        }
      } else if (!status.hasContent) {
        const message = `${deliverable.name} vazio ou muito curto (${status.wordCount} palavras)`;
        if (deliverable.blocking || strict) {
          issues.push(message);
          output += `- ❌ **${deliverable.name}** - Conteúdo insuficiente (${status.wordCount} palavras)\n`;
        } else {
          warnings.push(message);
          output += `- ⚠️ ${deliverable.name} - Conteúdo curto (${status.wordCount} palavras)\n`;
        }
      } else {
        passed.push(deliverable.name);
        output += `- ✅ ${deliverable.name} (${status.wordCount} palavras)\n`;
      }
    }

    output += "\n";
  }

  // Check synthesis confidence
  const confidence = checkSynthesisConfidence(basePath);
  output += `### CONFIDENCE\n\n`;

  if (confidence === null) {
    issues.push("Synthesis não encontrada - impossível calcular confidence");
    output += `- ❌ **Confidence:** Não calculável (synthesis ausente)\n\n`;
  } else if (confidence < 70) {
    issues.push(`Confidence ${confidence}% abaixo do mínimo (70%)`);
    output += `- ❌ **Confidence:** ${confidence}% (mínimo: 70%)\n\n`;
  } else {
    passed.push(`Confidence ${confidence}%`);
    output += `- ✅ **Confidence:** ${confidence}%\n\n`;
  }

  // Final verdict
  output += `---

## Resultado

`;

  if (issues.length === 0) {
    output += `### ✅ PASSED

Research Gate aprovado com ${passed.length} deliverables.

${warnings.length > 0 ? `**Avisos (não bloqueantes):**\n${warnings.map((w) => `- ${w}`).join("\n")}\n` : ""}

**Próximo passo:** Iniciar Briefing Gate (Fases HELIX 1-10)`;

    // Record validation
    insertValidation({
      offer_id: offerPath,
      copy_type: "research_gate",
      verdict: "PASSED",
      logic_score: (passed.length / (passed.length + issues.length)) * 10,
    });
  } else {
    output += `### ❌ BLOCKED

Research Gate bloqueado por ${issues.length} problema(s):

${issues.map((i) => `- ${i}`).join("\n")}

**Ação requerida:** Completar deliverables faltantes antes de prosseguir.

${warnings.length > 0 ? `**Avisos adicionais:**\n${warnings.map((w) => `- ${w}`).join("\n")}\n` : ""}`;

    // Record validation
    insertValidation({
      offer_id: offerPath,
      copy_type: "research_gate",
      verdict: "BLOCKED",
      objections: issues,
      improvements: warnings,
    });
  }

  return output;
}

function validateBriefingGate(basePath: string, offerPath: string, strict: boolean): string {
  const issues: string[] = [];
  const warnings: string[] = [];
  const passed: string[] = [];
  const discoveredPhases: { phase: number; path: string }[] = [];

  let output = `# Briefing Gate Validation

**Oferta:** ${offerPath}
**Modo:** ${strict ? "Strict" : "Normal"}
**Método:** Descoberta dinâmica (BSSF v1.0)

---

## Fases HELIX

| Fase | Nome | Status | Arquivo | Palavras |
|------|------|--------|---------|----------|
`;

  // DYNAMIC DISCOVERY: Descobre cada fase usando glob patterns flexíveis
  for (const phaseDef of PHASE_DEFINITIONS) {
    const discoveredPath = discoverPhaseFile(basePath, phaseDef.phase);

    if (!discoveredPath) {
      const message = `Fase ${phaseDef.phase} (${phaseDef.name}) não encontrada`;
      if (phaseDef.critical || strict) {
        issues.push(message);
        output += `| ${phaseDef.phase} | ${phaseDef.name} | ❌ Ausente | - | - |\n`;
      } else {
        warnings.push(message);
        output += `| ${phaseDef.phase} | ${phaseDef.name} | ⚠️ Ausente | - | - |\n`;
      }
    } else {
      discoveredPhases.push({ phase: phaseDef.phase, path: discoveredPath });
      const status = checkDeliverable(basePath, { path: discoveredPath, name: phaseDef.name });
      const shortPath = path.basename(discoveredPath);

      if (!status.hasContent) {
        const message = `Fase ${phaseDef.phase} (${phaseDef.name}) incompleta`;
        if (phaseDef.critical || strict) {
          issues.push(message);
          output += `| ${phaseDef.phase} | ${phaseDef.name} | ❌ Incompleta | ${shortPath} | ${status.wordCount} |\n`;
        } else {
          warnings.push(message);
          output += `| ${phaseDef.phase} | ${phaseDef.name} | ⚠️ Curta | ${shortPath} | ${status.wordCount} |\n`;
        }
      } else {
        passed.push(`Fase ${phaseDef.phase}`);
        output += `| ${phaseDef.phase} | ${phaseDef.name} | ✅ OK | ${shortPath} | ${status.wordCount} |\n`;
      }
    }
  }

  // Check for critical phases content quality
  output += `\n---

## Validação de Fases Críticas

`;

  // Check MUP/MUS (Phase 5) - usa descoberta dinâmica
  const phase5Discovered = discoveredPhases.find(p => p.phase === 5);
  const phase5Path = phase5Discovered ? path.join(basePath, phase5Discovered.path) : null;

  if (phase5Path && existsSync(phase5Path)) {
    const content = readFileSync(phase5Path, "utf-8");
    const hasMUP = content.toLowerCase().includes("mup") || content.toLowerCase().includes("promessa") || content.toLowerCase().includes("mecanismo único do problema");
    const hasMUS = content.toLowerCase().includes("mus") || content.toLowerCase().includes("solução") || content.toLowerCase().includes("mecanismo único da solução");

    if (!hasMUP) {
      issues.push("MUP não definido na Fase 5");
      output += `- ❌ **MUP (Mecanismo Único do Problema):** Não encontrado\n`;
    } else {
      output += `- ✅ MUP definido\n`;
    }

    // MUS pode estar na Fase 5 ou 6
    if (hasMUS) {
      output += `- ✅ MUS definido (na Fase 5)\n`;
    }
  } else {
    output += `- ⚠️ Fase 5 não encontrada para validação de conteúdo\n`;
  }

  // Check DRE/One Belief (Phase 6) - usa descoberta dinâmica
  const phase6Discovered = discoveredPhases.find(p => p.phase === 6);
  const phase6Path = phase6Discovered ? path.join(basePath, phase6Discovered.path) : null;

  if (phase6Path && existsSync(phase6Path)) {
    const content = readFileSync(phase6Path, "utf-8");
    const hasDRE = content.toLowerCase().includes("dre") || content.toLowerCase().includes("one belief") || content.toLowerCase().includes("crença");
    const hasMUS = content.toLowerCase().includes("mus") || content.toLowerCase().includes("solução") || content.toLowerCase().includes("mecanismo único da solução");
    const hasOffer = content.toLowerCase().includes("oferta") || content.toLowerCase().includes("offer") || content.toLowerCase().includes("produto");

    if (!hasDRE) {
      warnings.push("DRE/One Belief não explícito na Fase 6");
      output += `- ⚠️ DRE (One Belief): Não explícito\n`;
    } else {
      output += `- ✅ DRE definido\n`;
    }

    if (!hasMUS && !phase5Path) {
      issues.push("MUS não definido");
      output += `- ❌ **MUS (Mecanismo Único da Solução):** Não encontrado\n`;
    } else if (hasMUS) {
      output += `- ✅ MUS definido (na Fase 6)\n`;
    }

    if (!hasOffer) {
      warnings.push("Oferta não explícita na Fase 6");
      output += `- ⚠️ Oferta: Verificar detalhes na Fase 7\n`;
    } else {
      output += `- ✅ Oferta definida\n`;
    }
  }

  // Final verdict
  output += `\n---

## Resultado

`;

  // Add discovered phases info
  if (discoveredPhases.length > 0) {
    output += `\n---

## Arquivos Descobertos

\`\`\`
${discoveredPhases.map(p => `Fase ${p.phase}: ${p.path}`).join("\n")}
\`\`\`

`;
  }

  if (issues.length === 0) {
    output += `### ✅ PASSED

Briefing Gate aprovado.

- Fases completas: ${passed.length}/10
- Arquivos descobertos: ${discoveredPhases.length}
${warnings.length > 0 ? `- Avisos: ${warnings.length}\n` : ""}

**Próximo passo:** Executar copy-critic STAND test antes da produção.

⚠️ **IMPORTANTE:** Fases críticas (MUP/MUS/DRE) requerem APROVAÇÃO HUMANA antes de prosseguir.`;

    // Record validation
    insertValidation({
      offer_id: offerPath,
      copy_type: "briefing_gate",
      verdict: "PASSED",
      logic_score: (passed.length / 10) * 10,
    });
  } else {
    output += `### ❌ BLOCKED

Briefing Gate bloqueado por ${issues.length} problema(s):

${issues.map((i) => `- ${i}`).join("\n")}

**Ação requerida:** Completar fases faltantes.

${warnings.length > 0 ? `**Avisos adicionais:**\n${warnings.map((w) => `- ${w}`).join("\n")}\n` : ""}`;

    // Record validation
    insertValidation({
      offer_id: offerPath,
      copy_type: "briefing_gate",
      verdict: "BLOCKED",
      objections: issues,
      improvements: warnings,
    });
  }

  return output;
}

// BLACK Gate validation function
function validateBlackGate(copy: string): {
  passed: boolean;
  score: number;
  gates: { name: string; score: number; passed: boolean; feedback: string }[];
} {
  const gateResults: { name: string; score: number; passed: boolean; feedback: string }[] = [];
  let totalScore = 0;
  let blockingFailed = false;

  for (const gate of BLACK_GATES) {
    let gateScore = 5; // Base score

    for (const { pattern, weight } of gate.patterns) {
      const matches = copy.match(pattern);
      if (matches) {
        gateScore += matches.length * weight * 0.5;
      }
    }

    // Normalize to 1-10
    gateScore = Math.min(10, Math.max(1, gateScore));
    const passed = gateScore >= gate.threshold + 5; // threshold + 5 = passing score

    if (!passed && gate.blocking) {
      blockingFailed = true;
    }

    gateResults.push({
      name: gate.name,
      score: Math.round(gateScore * 10) / 10,
      passed,
      feedback: passed
        ? `✅ ${gate.description}`
        : `❌ ${gate.description} - Precisa melhorar`,
    });

    totalScore += gateScore;
  }

  const avgScore = totalScore / BLACK_GATES.length;

  return {
    passed: !blockingFailed && avgScore >= 7,
    score: Math.round(avgScore * 10) / 10,
    gates: gateResults,
  };
}

function validateProductionGate(basePath: string, offerPath: string, strict: boolean): string {
  // Check for production files
  const productionDir = path.join(basePath, "production");

  let output = `# Production Gate Validation

**Oferta:** ${offerPath}

---

## Deliverables de Produção

`;

  if (!existsSync(productionDir)) {
    return output + `### ❌ BLOCKED

Diretório de produção não encontrado.

Crie \`production/\` e use o workflow de capítulos:
1. \`write_chapter\` para cada capítulo
2. \`layered_review\` para revisão em camadas
3. \`blind_critic\` + \`emotional_stress_test\` para validação final`;
  }

  // Check for production files
  const productionFiles = [
    { path: "production/vsl/draft/*.md", name: "VSL Draft" },
    { path: "production/vsl/final/*.md", name: "VSL Final" },
    { path: "production/landing-page/*.md", name: "Landing Page" },
    { path: "production/creatives/*.md", name: "Criativos" },
    { path: "production/emails/*.md", name: "Email Sequence" },
  ];

  const issues: string[] = [];
  const passed: string[] = [];

  for (const file of productionFiles) {
    const fullPath = path.join(basePath, file.path);
    const files = glob.sync(fullPath);

    if (files.length === 0) {
      output += `- ⚠️ ${file.name}: Não encontrado\n`;
    } else {
      passed.push(file.name);
      output += `- ✅ ${file.name}: ${files.length} arquivo(s)\n`;
    }
  }

  // Check validation history
  const validations = getValidationHistory(offerPath, "production");

  output += `\n---

## Histórico de Validações

`;

  if (validations.length === 0) {
    issues.push("Nenhuma validação de produção encontrada");
    output += `⚠️ Nenhuma validação registrada.

Use:
- \`blind_critic\` para avaliação cega
- \`emotional_stress_test\` para ressonância emocional
- \`layered_review\` para revisão em 3 camadas`;
  } else {
    output += `| Data | Tipo | Veredicto | Score |
|------|------|-----------|-------|
`;
    for (const v of validations.slice(0, 5)) {
      const score = v.genericidade_score || v.emotion_score || v.rmbc_score || "-";
      output += `| ${v.created_at} | ${v.copy_type} | ${v.verdict} | ${score} |\n`;
    }
  }

  // BLACK Gate validation (if VSL final exists)
  const vslFinalFiles = glob.sync(path.join(basePath, "production/vsl/final/*.md"));
  let blackGateResult = null;

  if (vslFinalFiles.length > 0) {
    // Read first VSL final for BLACK validation
    try {
      const vslContent = readFileSync(vslFinalFiles[0], "utf-8");
      blackGateResult = validateBlackGate(vslContent);

      output += `\n---

## BLACK Gate Validation (Framework v6.4)

| Gate | Score | Status |
|------|-------|--------|
`;
      for (const gate of blackGateResult.gates) {
        output += `| ${gate.name} | ${gate.score}/10 | ${gate.passed ? "✅" : "❌"} |\n`;
      }

      output += `
**BLACK Score:** ${blackGateResult.score}/10
**Status:** ${blackGateResult.passed ? "✅ PASSED" : "❌ BLOCKED"}

`;

      if (!blackGateResult.passed) {
        output += `### Gates que precisam atenção:

`;
        for (const gate of blackGateResult.gates.filter((g) => !g.passed)) {
          output += `- **${gate.name}:** ${gate.feedback}\n`;
        }
        output += `\n`;
      }
    } catch {
      // Ignore read errors
    }
  }

  // Final verdict
  output += `\n---

## Resultado

`;

  const hasVslFinal = passed.includes("VSL Final");
  const hasValidation = validations.some((v) => v.verdict === "APROVADO");
  const blackPassed = blackGateResult?.passed ?? false;

  if (hasVslFinal && hasValidation && blackPassed) {
    output += `### ✅ READY FOR DELIVERY (BLACK APPROVED)

Produção validada e pronta para entrega.

**Checklist final:**
- [x] VSL final revisada
- [x] Validação aprovada
- [x] BLACK Gate passed
- [ ] Aprovação humana final`;
  } else if (hasVslFinal && hasValidation && !blackPassed) {
    output += `### ⚠️ BLOQUEADO - BLACK GATE FAILED

A copy passou nas validações básicas mas FALHOU no BLACK Gate.

**Copy confortável = Copy que FALHOU.**

**Ações necessárias:**
${blackGateResult?.gates.filter((g) => !g.passed).map((g) => `- Melhorar: ${g.name}`).join("\n") || "- Aplicar Fear Hierarchy níveis 4-5"}

Use \`black_validation\` para análise detalhada.`;
  } else {
    output += `### ⚠️ EM PROGRESSO

Produção ainda não finalizada:

${!hasVslFinal ? "- [ ] VSL final pendente\n" : "- [x] VSL final ok\n"}
${!hasValidation ? "- [ ] Validação pendente (usar blind_critic + emotional_stress_test)\n" : "- [x] Validação ok\n"}
${!blackPassed ? "- [ ] BLACK Gate pendente\n" : "- [x] BLACK Gate ok\n"}

**Próximo passo:** Completar items pendentes antes da entrega.`;
  }

  return output;
}
