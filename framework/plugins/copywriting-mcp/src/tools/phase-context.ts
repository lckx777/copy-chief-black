/**
 * Phase Context Tool
 *
 * Carrega contexto apropriado para cada fase HELIX.
 * Implementa Progressive Loading (Pesquisa 09.md).
 *
 * v2.0.0 - Refatorado para usar helix-phases.yaml como Single Source of Truth
 * BSSF Score: 8.1, GBS: 90%
 *
 * Hierarquia:
 * 1. CONTEXT.md (sempre)
 * 2. mecanismo-unico.yaml (fases 5, 6, 7, 9, 10)
 * 3. synthesis.md (decisões-chave)
 * 4. Fase específica sendo trabalhada
 * 5. Swipes/references apenas quando produzindo
 */

import { z } from "zod";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { glob } from "glob";
import yaml from "js-yaml";

// Type definitions for the schema
interface PhaseConfig {
  name: string;
  short_name: string;
  description: string;
  required_files: string[];
  optional_files: string[];
  template_file: string;  // NEW: Path to skill template
  output_file: string;
  previous_output?: string;
  next_phase: string;
  load_mechanism?: boolean;
  methodologies?: string[];
  validations?: string[];
  guidance: string;
}

interface HelixSchema {
  version: string;
  updated: string;
  methodologies: Record<string, string>;
  phases: Record<number, PhaseConfig>;
  config: {
    always_load: string[];
    mechanism_phases: number[];
    validation_tools: string[];
    production_tools: string[];
  };
}

// Load schema from YAML file
function loadHelixSchema(): HelixSchema {
  const schemaPath = path.join(
    process.env.HOME || "~",
    ".claude",
    "schemas",
    "helix-phases.yaml"
  );

  if (!existsSync(schemaPath)) {
    throw new Error(`Schema não encontrado: ${schemaPath}. Execute a configuração do ecossistema.`);
  }

  const schemaContent = readFileSync(schemaPath, "utf-8");
  return yaml.load(schemaContent) as HelixSchema;
}

// Tool definition for MCP
export const phaseContextTool = {
  name: "get_phase_context",
  description: `Carrega contexto apropriado para uma fase HELIX específica.

Implementa Progressive Loading:
- HOT: CONTEXT.md + mecanismo-unico.yaml + synthesis.md
- WARM: Fase específica + dependências
- COLD: Nunca carrega (raw/, dados brutos)

Fases HELIX:
1. Identificação e Posicionamento
2. Pesquisa de Mercado e Concorrência
3. Avatar e Psicologia Profunda
4. Níveis de Consciência
5. Problema, Vilão e MUP
6. Solução, Especialista e MUS
7. Big Offer
8. Fechamento e Pitch
9. Leads e Ganchos
10. Progressão Emocional e VSL

Use no início de cada fase para contexto otimizado.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      phase: {
        type: "number",
        minimum: 1,
        maximum: 10,
        description: "Número da fase HELIX (1-10)",
      },
      offer_path: {
        type: "string",
        description: "Caminho da oferta (ex: concursos/hacker)",
      },
      include_swipes: {
        type: "boolean",
        default: false,
        description: "Incluir swipes relevantes (apenas para produção)",
      },
    },
    required: ["phase", "offer_path"],
  },
};

// Input validation
const InputSchema = z.object({
  phase: z.number().min(1).max(10),
  offer_path: z.string(),
  include_swipes: z.boolean().default(false),
});

// Load template file from skill
function loadTemplate(templatePath: string): string | null {
  // Resolve ~ to home directory
  const resolvedPath = templatePath.replace(/^~/, process.env.HOME || "");

  if (!existsSync(resolvedPath)) {
    return null;
  }

  try {
    return readFileSync(resolvedPath, "utf-8");
  } catch (e) {
    return null;
  }
}

// Load and format mechanism file
function loadMechanism(offerBase: string): string | null {
  const mechanismPath = path.join(offerBase, "mecanismo-unico.yaml");

  if (!existsSync(mechanismPath)) {
    return null;
  }

  try {
    const content = readFileSync(mechanismPath, "utf-8");
    const mechanism = yaml.load(content) as Record<string, unknown>;

    let output = `### mecanismo-unico.yaml

**Estado:** ${mechanism.state || "UNDEFINED"}

`;

    // MUP Section
    if (mechanism.mup && typeof mechanism.mup === "object") {
      const mup = mechanism.mup as Record<string, unknown>;
      output += `#### MUP (Mecanismo Único do Problema)

- **Nova Causa:** ${mup.nova_causa || "(não definido)"}
- **Sexy Cause:** ${mup.sexy_cause || "(não definido)"}
- **Problema Fundamental:** ${mup.problema_fundamental || "(não definido)"}
- **Statement:** ${mup.statement || "(não definido)"}

`;
    }

    // MUS Section
    if (mechanism.mus && typeof mechanism.mus === "object") {
      const mus = mechanism.mus as Record<string, unknown>;
      output += `#### MUS (Mecanismo Único da Solução)

- **Nova Oportunidade:** ${mus.nova_oportunidade || "(não definido)"}
- **Ingrediente Hero:** ${mus.ingrediente_hero || "(não definido)"}
- **Gimmick Name:** ${mus.gimmick_name || "(não definido)"}
- **Authority Hook:** ${mus.authority_hook || "(não definido)"}
- **Origin Story:** ${mus.origin_story || "(não definido)"}
- **Statement:** ${mus.statement || "(não definido)"}

`;
    }

    // Validation Section
    if (mechanism.validation && typeof mechanism.validation === "object") {
      const validation = mechanism.validation as Record<string, unknown>;
      output += `#### Validação

- **MUP Score:** ${validation.mup_score || "N/A"}
- **MUS Score:** ${validation.mus_score || "N/A"}
- **Emotional Test:** ${validation.emotional_test || "N/A"}

`;
    }

    return output;
  } catch (e) {
    return `### mecanismo-unico.yaml

⚠️ Erro ao carregar: ${e instanceof Error ? e.message : "erro desconhecido"}

`;
  }
}

// Handler
export async function phaseContextHandler(args: unknown): Promise<string> {
  const input = InputSchema.parse(args);
  const { phase, offer_path, include_swipes } = input;

  // Load schema
  let schema: HelixSchema;
  try {
    schema = loadHelixSchema();
  } catch (e) {
    return `Erro ao carregar schema HELIX: ${e instanceof Error ? e.message : "erro desconhecido"}`;
  }

  const config = schema.phases[phase];
  if (!config) {
    return `Fase ${phase} inválida. Use 1-10.`;
  }

  // Resolve base path
  const ecosystemBase = process.env.COPYWRITING_ECOSYSTEM || path.join(process.env.HOME || "~", "copywriting-ecosystem");
  const offerBase = path.join(ecosystemBase, offer_path);

  if (!existsSync(offerBase)) {
    return `Oferta não encontrada: ${offer_path}

Verifique se o caminho está correto. Exemplos:
- concursos/hacker
- concursos/gabaritando-lei-seca
- concursos/gabaritando-portugues`;
  }

  // Build context output
  let output = `# Contexto para Fase ${phase}: ${config.name}

**Oferta:** ${offer_path}
**Descrição:** ${config.description}
**Próxima fase:** ${config.next_phase}
${config.previous_output ? `**Dependência:** ${config.previous_output}` : ""}

---

## Arquivos Carregados (HOT)

`;

  // Load required files
  const loadedFiles: string[] = [];
  const missingFiles: string[] = [];

  for (const filePath of config.required_files) {
    const fullPath = path.join(offerBase, filePath);
    const globPaths = await glob(fullPath);

    if (globPaths.length === 0 && !existsSync(fullPath)) {
      missingFiles.push(filePath);
      continue;
    }

    const pathsToLoad = globPaths.length > 0 ? globPaths : [fullPath];

    for (const p of pathsToLoad) {
      if (existsSync(p)) {
        try {
          const content = readFileSync(p, "utf-8");
          const relativePath = path.relative(offerBase, p);

          output += `### ${relativePath}\n\n`;

          // Truncate if too long (keep under 2000 tokens approx)
          if (content.length > 8000) {
            output += content.substring(0, 8000) + "\n\n*[Truncado - arquivo muito grande]*\n\n";
          } else {
            output += content + "\n\n";
          }

          loadedFiles.push(relativePath);
        } catch (e) {
          missingFiles.push(filePath);
        }
      }
    }
  }

  // Load mechanism for relevant phases (5, 6, 7, 9, 10)
  if (config.load_mechanism || schema.config.mechanism_phases.includes(phase)) {
    const mechanismContent = loadMechanism(offerBase);
    if (mechanismContent) {
      output += mechanismContent;
      loadedFiles.push("mecanismo-unico.yaml");
    } else {
      output += `### ⚠️ mecanismo-unico.yaml

Arquivo não encontrado. Este é **OBRIGATÓRIO** para a Fase ${phase}.

Crie o arquivo usando o template:
\`~/.claude/templates/mecanismo-unico-template.md\`

`;
      missingFiles.push("mecanismo-unico.yaml");
    }
  }

  // Report missing files
  if (missingFiles.length > 0) {
    output += `## ⚠️ Arquivos Ausentes

Os seguintes arquivos são obrigatórios para esta fase mas não foram encontrados:

${missingFiles.map((f) => `- \`${f}\``).join("\n")}

**Ação recomendada:** Complete as fases anteriores antes de prosseguir.

`;
  }

  // Optional files section
  output += `## Arquivos Disponíveis (WARM)

Estes arquivos podem ser carregados sob demanda:

`;

  for (const filePath of config.optional_files) {
    const fullPath = path.join(offerBase, filePath);
    const globPaths = await glob(fullPath);

    if (globPaths.length > 0) {
      for (const p of globPaths) {
        const relativePath = path.relative(offerBase, p);
        output += `- \`${relativePath}\` ✓\n`;
      }
    } else if (existsSync(fullPath)) {
      const relativePath = path.relative(offerBase, fullPath);
      output += `- \`${relativePath}\` ✓\n`;
    } else {
      output += `- \`${filePath}\` (não existe)\n`;
    }
  }

  // Swipes section (only if requested)
  if (include_swipes) {
    output += `\n## Swipes Relevantes\n\n`;

    const swipesPath = path.join(ecosystemBase, "swipes", offer_path.split("/")[0]);
    if (existsSync(swipesPath)) {
      const swipeFiles = await glob(path.join(swipesPath, "*.md"));
      if (swipeFiles.length > 0) {
        output += `Encontrados ${swipeFiles.length} swipes no nicho:\n\n`;
        for (const swipe of swipeFiles.slice(0, 5)) {
          output += `- \`${path.basename(swipe)}\`\n`;
        }
      } else {
        output += `Nenhum swipe encontrado em ${swipesPath}\n`;
      }
    } else {
      output += `Diretório de swipes não encontrado: ${swipesPath}\n`;
    }
  }

  // Methodologies section
  if (config.methodologies && config.methodologies.length > 0) {
    output += `\n## Metodologias Aplicáveis\n\n`;
    for (const methodKey of config.methodologies) {
      const methodName = schema.methodologies[methodKey] || methodKey;
      output += `- **${methodName}**\n`;
    }
  }

  // Validations section
  if (config.validations && config.validations.length > 0) {
    output += `\n## Validações Obrigatórias\n\n`;
    for (const validation of config.validations) {
      output += `- [ ] ${validation}\n`;
    }
  }

  // Load and show template
  if (config.template_file) {
    const templateContent = loadTemplate(config.template_file);
    if (templateContent) {
      output += `
---

## TEMPLATE A PREENCHER

**Arquivo de saída:** \`${config.output_file}\`

> **INSTRUÇÃO:** Preencha CADA SEÇÃO do template abaixo fielmente.
> Após preencher, salve o resultado em \`${offer_path}/${config.output_file}\`

\`\`\`markdown
${templateContent}
\`\`\`

`;
    } else {
      output += `
---

## ⚠️ Template não encontrado

Template esperado em: \`${config.template_file}\`

Verifique se a skill helix-system-agent está instalada corretamente.

`;
    }
  }

  // Phase-specific guidance from schema
  output += `
---

## Orientação Rápida

${config.guidance}
`;

  // Add tools reminder for production phases
  if (phase >= 5) {
    output += `
---

## Ferramentas Recomendadas

`;
    if (phase === 5 || phase === 6) {
      output += `- \`consensus\` (MCP zen) - Validar TOP 3 candidatos
- \`blind_critic\` (MCP copywriting) - Validar statements (score >= 8)
- \`emotional_stress_test\` (MCP copywriting) - Validar ressonância emocional
`;
    } else if (phase === 9) {
      output += `- \`blind_critic\` (MCP copywriting) - Validar headlines
- \`voc_search\` (MCP copywriting) - Confirmar linguagem do avatar
`;
    } else if (phase === 10) {
      output += `- \`write_chapter\` (MCP copywriting) - Produzir por capítulos
- \`layered_review\` (MCP copywriting) - Revisar em 3 camadas
- \`black_validation\` (MCP copywriting) - Validação final antes de entregar
`;
    }
  }

  return output;
}
