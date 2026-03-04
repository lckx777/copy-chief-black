/**
 * Mecanismo Único Tool
 *
 * Gerencia o ciclo completo do Mecanismo Único (MUP/MUS/INDUTOR):
 * - create_mecanismo: Cria arquivo canônico se não existe
 * - get_mecanismo: Retorna estado atual
 * - update_mecanismo: Atualiza campos específicos
 * - validate_mecanismo: Valida e retorna resultado
 *
 * Framework: Ramalho Puzzle Pieces + Copy Chief BLACK
 */

import * as fs from "fs";
import * as path from "path";

// Thresholds
const RMBC_THRESHOLD = 7;
const BLIND_CRITIC_THRESHOLD = 8;
const EMOTIONAL_STRESS_THRESHOLD = 8;

// States
type MecanismoState =
  | "UNDEFINED"
  | "DRAFT"
  | "PENDING_VALIDATION"
  | "VALIDATED"
  | "APPROVED";

// Tool definitions
export const mecanismoUnicoTools = [
  {
    name: "create_mecanismo",
    description: `Cria arquivo mecanismo-unico.yaml para uma oferta.

Usa o template canônico com estrutura:
- MUP: Nova Causa, Sexy Cause, Problema Fundamental
- MUS: Ingrediente Hero, Gimmick Name, Origin Story, Authority Hook
- INDUTOR: Nome Sistema, Componentes

QUANDO USAR:
- Início da Fase 5 HELIX (MUP)
- Quando oferta não tem mecanismo-unico.yaml

RETORNA: Caminho do arquivo criado`,
    inputSchema: {
      type: "object",
      properties: {
        offer_path: {
          type: "string",
          description: "Caminho absoluto para a pasta da oferta",
        },
        offer_name: {
          type: "string",
          description: "Nome da oferta (ex: 'Hacker do Concurso')",
        },
        nicho: {
          type: "string",
          description: "Nicho da oferta (ex: 'concursos', 'saude')",
        },
      },
      required: ["offer_path", "offer_name", "nicho"],
    },
  },
  {
    name: "get_mecanismo",
    description: `Retorna o estado atual do Mecanismo Único de uma oferta.

RETORNA:
- state: UNDEFINED|DRAFT|PENDING_VALIDATION|VALIDATED|APPROVED
- mup: Resumo do MUP (sexy_cause, etc)
- mus: Resumo do MUS (gimmick_name, etc)
- validation: Scores de RMBC e MCP
- missing: Lista de campos faltantes`,
    inputSchema: {
      type: "object",
      properties: {
        offer_path: {
          type: "string",
          description: "Caminho absoluto para a pasta da oferta",
        },
      },
      required: ["offer_path"],
    },
  },
  {
    name: "update_mecanismo",
    description: `Atualiza campos específicos do mecanismo-unico.yaml.

USE APÓS:
- consensus selecionar MUP → atualizar sexy_cause
- blind_critic aprovar → atualizar scores
- emotional_stress_test aprovar → atualizar score
- humano aprovar → atualizar human_approved + state

CAMPOS ATUALIZÁVEIS:
- mup.sexy_cause.name
- mup.nova_causa
- mus.gimmick_name.name
- mus.ingrediente_hero.name
- validation.mcp_validation.*
- validation.rmbc_scores.*
- validation.human_approved
- validation.state`,
    inputSchema: {
      type: "object",
      properties: {
        offer_path: {
          type: "string",
          description: "Caminho absoluto para a pasta da oferta",
        },
        field: {
          type: "string",
          description:
            "Campo a atualizar (ex: 'mup.sexy_cause.name', 'validation.state')",
        },
        value: {
          type: "string",
          description: "Novo valor para o campo",
        },
      },
      required: ["offer_path", "field", "value"],
    },
  },
  {
    name: "validate_mecanismo",
    description: `Valida mecanismo-unico.yaml e retorna resultado detalhado.

VERIFICA:
1. Campos obrigatórios preenchidos (MUP, MUS, INDUTOR)
2. Scores RMBC >= 7 (média)
3. Scores MCP >= 8 (consensus, blind_critic, emotional_stress_test)

ATUALIZA AUTOMATICAMENTE:
- state para PENDING_VALIDATION se campos completos
- state para VALIDATED se MCP scores passam
- all_passed se todos thresholds atingidos

RETORNA:
- valid: boolean
- state: estado atual
- issues: lista de problemas
- next_steps: próximas ações`,
    inputSchema: {
      type: "object",
      properties: {
        offer_path: {
          type: "string",
          description: "Caminho absoluto para a pasta da oferta",
        },
      },
      required: ["offer_path"],
    },
  },
];

// Template YAML
const TEMPLATE = `# Mecanismo Unico: {{OFFER_NAME}}
# Version: 1.0.0
# Schema: ~/.claude/schemas/mecanismo-unico.schema.yaml
# Status: DRAFT (auto-created via MCP)

mecanismo_unico:
  # ============================================
  # PARTE 1: MUP (Mecanismo Unico do Problema)
  # ============================================
  mup:
    nova_causa: ""

    sexy_cause:
      name: ""
      candidates:
        - name: ""
          transmissivel: false
          score: 0
        - name: ""
          transmissivel: false
          score: 0
        - name: ""
          transmissivel: false
          score: 0

    problema_fundamental: ""
    causa_raiz: ""

  # ============================================
  # PARTE 2: MUS (Mecanismo Unico da Solucao)
  # ============================================
  mus:
    nova_oportunidade: ""

    ingrediente_hero:
      name: ""
      nicho: "{{NICHO}}"

    gimmick_name:
      name: ""
      candidates:
        - name: ""
          ligado_ao_hero: false
          chiclete: false
          score: 0
      validation:
        ligado_ao_hero: false
        chiclete: false

    origin_story:
      description: ""
      validation:
        credibilidade: false
        curiosidade: false

    authority_hook:
      name: ""
      type: ""

  # ============================================
  # PARTE 3: INDUTOR (Metodo/Produto)
  # ============================================
  indutor:
    nome_sistema:
      name: ""
      validation:
        memoravel: false
        diferente_concorrente: false
        comunica_resultado: false

    componentes: []
    ativacao: ""

  # ============================================
  # GANCHO DA SOLUCAO (Formula Ramalho)
  # ============================================
  gancho_solucao:
    formula: |
      "Ja ouviu falar desse [GIMMICK NAME] que [ORIGIN STORY] estao usando
      secretamente para [DESEJO]? Ja estao chamando isso de [AUTHORITY HOOK]."
    completo: ""

  # ============================================
  # VALIDACAO
  # ============================================
  validation:
    rmbc_scores:
      digerivel: 0
      unico: 0
      provavel: 0
      conectado: 0
    rmbc_average: 0
    rmbc_passed: false

    mcp_validation:
      consensus_passed: false
      blind_critic_mup_score: 0
      blind_critic_mus_score: 0
      emotional_stress_test_score: 0
      all_passed: false

    human_approved: false
    approved_by: ""
    approved_at: ""

    state: "DRAFT"

  # ============================================
  # METADATA
  # ============================================
  metadata:
    offer_name: "{{OFFER_NAME}}"
    nicho: "{{NICHO}}"
    created_at: "{{DATE}}"
    updated_at: "{{DATE}}"
    version: "1.0.0"
`;

// Helper: Get mecanismo file path
function getMecanismoPath(offerPath: string): string {
  return path.join(offerPath, "mecanismo-unico.yaml");
}

// Helper: Parse simple YAML value
function getYamlValue(content: string, key: string): string {
  const regex = new RegExp(`${key}:\\s*["']?([^"'\\n]+)["']?`, "m");
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

// Helper: Update YAML field
function updateYamlField(
  content: string,
  fieldPath: string,
  value: string
): string {
  const key = fieldPath.split(".").pop() || fieldPath;

  // Handle different value types
  let formattedValue = value;
  if (value === "true" || value === "false") {
    formattedValue = value;
  } else if (!isNaN(Number(value))) {
    formattedValue = value;
  } else {
    formattedValue = `"${value}"`;
  }

  const regex = new RegExp(`(${key}:)\\s*.*$`, "m");
  return content.replace(regex, `$1 ${formattedValue}`);
}

// Handler: create_mecanismo
export async function createMecanismoHandler(args: {
  offer_path: string;
  offer_name: string;
  nicho: string;
}): Promise<string> {
  const { offer_path, offer_name, nicho } = args;
  const mecanismoPath = getMecanismoPath(offer_path);

  // Check if already exists
  if (fs.existsSync(mecanismoPath)) {
    return `⚠️ Arquivo já existe: ${mecanismoPath}\n\nUse get_mecanismo para ver o estado atual ou update_mecanismo para modificar.`;
  }

  // Check if offer path exists
  if (!fs.existsSync(offer_path)) {
    return `❌ Caminho da oferta não existe: ${offer_path}`;
  }

  // Create from template
  const date = new Date().toISOString().split("T")[0];
  const content = TEMPLATE.replace(/\{\{OFFER_NAME\}\}/g, offer_name)
    .replace(/\{\{NICHO\}\}/g, nicho)
    .replace(/\{\{DATE\}\}/g, date);

  fs.writeFileSync(mecanismoPath, content, "utf-8");

  return `✅ Arquivo criado: ${mecanismoPath}

📋 PRÓXIMOS PASSOS:

**Fase 5 (MUP):**
1. Preencher nova_causa, sexy_cause, problema_fundamental
2. Usar consensus (zen) para validar TOP 3 candidatos
3. Usar blind_critic para validar MUP Statement (score >= 8)
4. Chamar update_mecanismo para salvar resultados

**Fase 6 (MUS):**
1. Preencher ingrediente_hero, gimmick_name, origin_story, authority_hook
2. Usar blind_critic para validar MUS Statement (score >= 8)
3. Usar emotional_stress_test para validar MUP+MUS (score >= 8)
4. Chamar validate_mecanismo para avançar state

**Schema:** ~/.claude/schemas/mecanismo-unico.schema.yaml
**Rule:** ~/.claude/rules/mecanismo-unico.md`;
}

// Handler: get_mecanismo
export async function getMecanismoHandler(args: {
  offer_path: string;
}): Promise<string> {
  const { offer_path } = args;
  const mecanismoPath = getMecanismoPath(offer_path);

  if (!fs.existsSync(mecanismoPath)) {
    return `❌ Arquivo não encontrado: ${mecanismoPath}

Use create_mecanismo para criar o arquivo canônico.`;
  }

  const content = fs.readFileSync(mecanismoPath, "utf-8");

  // Extract key values
  const state = getYamlValue(content, "state");
  const sexyCause = getYamlValue(content, "sexy_cause");
  const gimmickName =
    content.match(/gimmick_name:\s*\n\s*name:\s*["']?([^"'\n]+)/)?.[1] || "";
  const ingredienteHero =
    content.match(/ingrediente_hero:\s*\n\s*name:\s*["']?([^"'\n]+)/)?.[1] ||
    "";
  const authorityHook =
    content.match(/authority_hook:\s*\n\s*name:\s*["']?([^"'\n]+)/)?.[1] || "";
  const nomeSistema =
    content.match(/nome_sistema:\s*\n\s*name:\s*["']?([^"'\n]+)/)?.[1] || "";

  // Extract scores
  const consensusPassed = content.includes("consensus_passed: true");
  const bcMup = parseInt(getYamlValue(content, "blind_critic_mup_score")) || 0;
  const bcMus = parseInt(getYamlValue(content, "blind_critic_mus_score")) || 0;
  const est =
    parseInt(getYamlValue(content, "emotional_stress_test_score")) || 0;
  const humanApproved = content.includes("human_approved: true");

  // Identify missing fields
  const missing: string[] = [];
  if (!sexyCause) missing.push("mup.sexy_cause.name");
  if (!gimmickName) missing.push("mus.gimmick_name.name");
  if (!ingredienteHero) missing.push("mus.ingrediente_hero.name");
  if (!authorityHook) missing.push("mus.authority_hook.name");
  if (!nomeSistema) missing.push("indutor.nome_sistema.name");

  // Determine next steps
  let nextSteps = "";
  if (state === "DRAFT" && missing.length > 0) {
    nextSteps = `Preencher campos faltantes: ${missing.join(", ")}`;
  } else if (state === "DRAFT" && missing.length === 0) {
    nextSteps = "Rodar validate_mecanismo para avançar para PENDING_VALIDATION";
  } else if (state === "PENDING_VALIDATION") {
    if (!consensusPassed)
      nextSteps = "Rodar consensus (zen) para selecionar MUP";
    else if (bcMup < BLIND_CRITIC_THRESHOLD)
      nextSteps = "Rodar blind_critic para MUP (score >= 8)";
    else if (bcMus < BLIND_CRITIC_THRESHOLD)
      nextSteps = "Rodar blind_critic para MUS (score >= 8)";
    else if (est < EMOTIONAL_STRESS_THRESHOLD)
      nextSteps = "Rodar emotional_stress_test (score >= 8)";
    else nextSteps = "Rodar validate_mecanismo para avançar para VALIDATED";
  } else if (state === "VALIDATED" && !humanApproved) {
    nextSteps =
      "HUMANO deve aprovar: update_mecanismo(..., 'validation.human_approved', 'true')";
  } else if (state === "APPROVED") {
    nextSteps = "Pronto para produção!";
  }

  const stateEmoji: Record<string, string> = {
    UNDEFINED: "⚪",
    DRAFT: "🟡",
    PENDING_VALIDATION: "🟠",
    VALIDATED: "🟢",
    APPROVED: "✅",
  };

  return `# Mecanismo Único: ${offer_path.split("/").pop()}

## Estado: ${stateEmoji[state] || "⚪"} ${state}

## MUP (Mecanismo Único do Problema)
- **Sexy Cause:** ${sexyCause || "❌ Não definido"}

## MUS (Mecanismo Único da Solução)
- **Ingrediente Hero:** ${ingredienteHero || "❌ Não definido"}
- **Gimmick Name:** ${gimmickName || "❌ Não definido"}
- **Authority Hook:** ${authorityHook || "❌ Não definido"}

## INDUTOR
- **Nome Sistema:** ${nomeSistema || "❌ Não definido"}

## Validação MCP
| Tool | Score | Threshold | Status |
|------|-------|-----------|--------|
| consensus | ${consensusPassed ? "PASSED" : "PENDING"} | Agreement | ${consensusPassed ? "✅" : "❌"} |
| blind_critic (MUP) | ${bcMup}/10 | ≥${BLIND_CRITIC_THRESHOLD} | ${bcMup >= BLIND_CRITIC_THRESHOLD ? "✅" : "❌"} |
| blind_critic (MUS) | ${bcMus}/10 | ≥${BLIND_CRITIC_THRESHOLD} | ${bcMus >= BLIND_CRITIC_THRESHOLD ? "✅" : "❌"} |
| emotional_stress_test | ${est}/10 | ≥${EMOTIONAL_STRESS_THRESHOLD} | ${est >= EMOTIONAL_STRESS_THRESHOLD ? "✅" : "❌"} |

## Aprovação Humana
${humanApproved ? "✅ Aprovado" : "❌ Pendente"}

${missing.length > 0 ? `## Campos Faltantes\n${missing.map((m) => `- ${m}`).join("\n")}` : ""}

## Próximo Passo
${nextSteps}`;
}

// Handler: update_mecanismo
export async function updateMecanismoHandler(args: {
  offer_path: string;
  field: string;
  value: string;
}): Promise<string> {
  const { offer_path, field, value } = args;
  const mecanismoPath = getMecanismoPath(offer_path);

  if (!fs.existsSync(mecanismoPath)) {
    return `❌ Arquivo não encontrado: ${mecanismoPath}\n\nUse create_mecanismo primeiro.`;
  }

  let content = fs.readFileSync(mecanismoPath, "utf-8");

  // Update the field
  content = updateYamlField(content, field, value);

  // Update updated_at
  const date = new Date().toISOString().split("T")[0];
  content = updateYamlField(content, "updated_at", date);

  fs.writeFileSync(mecanismoPath, content, "utf-8");

  // Special handling for state transitions
  if (field === "validation.human_approved" && value === "true") {
    content = fs.readFileSync(mecanismoPath, "utf-8");
    content = updateYamlField(content, "state", "APPROVED");
    fs.writeFileSync(mecanismoPath, content, "utf-8");

    return `✅ Campo atualizado: ${field} = ${value}
✅ State avançado para: APPROVED

🎉 Mecanismo Único APROVADO! Pronto para produção.`;
  }

  return `✅ Campo atualizado: ${field} = ${value}

Arquivo: ${mecanismoPath}`;
}

// Handler: validate_mecanismo
export async function validateMecanismoHandler(args: {
  offer_path: string;
}): Promise<string> {
  const { offer_path } = args;
  const mecanismoPath = getMecanismoPath(offer_path);

  if (!fs.existsSync(mecanismoPath)) {
    return `❌ Arquivo não encontrado: ${mecanismoPath}\n\nUse create_mecanismo primeiro.`;
  }

  let content = fs.readFileSync(mecanismoPath, "utf-8");

  // Check required fields
  const requiredFields = [
    { path: "sexy_cause", label: "Sexy Cause" },
    { path: "ingrediente_hero", label: "Ingrediente Hero" },
    { path: "gimmick_name", label: "Gimmick Name" },
    { path: "authority_hook", label: "Authority Hook" },
    { path: "nome_sistema", label: "Nome Sistema" },
  ];

  const missingFields: string[] = [];
  for (const field of requiredFields) {
    const regex = new RegExp(`${field.path}:\\s*\\n\\s*name:\\s*["']?([^"'\\n]+)`);
    const match = content.match(regex);
    if (!match || !match[1] || match[1].trim() === "") {
      missingFields.push(field.label);
    }
  }

  // Check MCP scores
  const consensusPassed = content.includes("consensus_passed: true");
  const bcMup = parseInt(getYamlValue(content, "blind_critic_mup_score")) || 0;
  const bcMus = parseInt(getYamlValue(content, "blind_critic_mus_score")) || 0;
  const est =
    parseInt(getYamlValue(content, "emotional_stress_test_score")) || 0;
  const humanApproved = content.includes("human_approved: true");

  const issues: string[] = [];
  let newState: MecanismoState = "DRAFT";

  // Check structure
  if (missingFields.length > 0) {
    issues.push(`Campos faltantes: ${missingFields.join(", ")}`);
  } else {
    // Structure complete, check MCP
    newState = "PENDING_VALIDATION";

    if (!consensusPassed) issues.push("consensus não executado");
    if (bcMup < BLIND_CRITIC_THRESHOLD)
      issues.push(`blind_critic MUP: ${bcMup}/10 (precisa ≥${BLIND_CRITIC_THRESHOLD})`);
    if (bcMus < BLIND_CRITIC_THRESHOLD)
      issues.push(`blind_critic MUS: ${bcMus}/10 (precisa ≥${BLIND_CRITIC_THRESHOLD})`);
    if (est < EMOTIONAL_STRESS_THRESHOLD)
      issues.push(`emotional_stress_test: ${est}/10 (precisa ≥${EMOTIONAL_STRESS_THRESHOLD})`);

    // All MCP passed?
    if (
      consensusPassed &&
      bcMup >= BLIND_CRITIC_THRESHOLD &&
      bcMus >= BLIND_CRITIC_THRESHOLD &&
      est >= EMOTIONAL_STRESS_THRESHOLD
    ) {
      newState = "VALIDATED";
      content = updateYamlField(content, "all_passed", "true");
    }

    // Human approved?
    if (humanApproved && newState === "VALIDATED") {
      newState = "APPROVED";
    }
  }

  // Update state
  const currentState = getYamlValue(content, "state");
  if (currentState !== newState) {
    content = updateYamlField(content, "state", newState);
    const date = new Date().toISOString().split("T")[0];
    content = updateYamlField(content, "updated_at", date);
    fs.writeFileSync(mecanismoPath, content, "utf-8");
  }

  const stateEmoji: Record<string, string> = {
    UNDEFINED: "⚪",
    DRAFT: "🟡",
    PENDING_VALIDATION: "🟠",
    VALIDATED: "🟢",
    APPROVED: "✅",
  };

  const isValid = newState === "VALIDATED" || newState === "APPROVED";

  let nextSteps = "";
  if (newState === "DRAFT") {
    nextSteps = `Preencher campos faltantes`;
  } else if (newState === "PENDING_VALIDATION") {
    const pending = [];
    if (!consensusPassed) pending.push("consensus (selecionar MUP)");
    if (bcMup < BLIND_CRITIC_THRESHOLD) pending.push("blind_critic (MUP)");
    if (bcMus < BLIND_CRITIC_THRESHOLD) pending.push("blind_critic (MUS)");
    if (est < EMOTIONAL_STRESS_THRESHOLD) pending.push("emotional_stress_test");
    nextSteps = `Executar: ${pending.join(" → ")}`;
  } else if (newState === "VALIDATED") {
    nextSteps = `HUMANO aprovar: update_mecanismo(offer_path, "validation.human_approved", "true")`;
  } else {
    nextSteps = "Pronto para produção!";
  }

  return `# Validação do Mecanismo Único

## Resultado: ${isValid ? "✅ VÁLIDO" : "❌ INVÁLIDO"}

## Estado: ${stateEmoji[newState]} ${newState}

${issues.length > 0 ? `## Issues (${issues.length})\n${issues.map((i) => `- ❌ ${i}`).join("\n")}` : "## Sem Issues\nTodos os critérios atendidos."}

## Próximo Passo
${nextSteps}

---
Arquivo: ${mecanismoPath}`;
}

// Export handlers map
export const mecanismoUnicoHandlers: Record<
  string,
  (args: any) => Promise<string>
> = {
  create_mecanismo: createMecanismoHandler,
  get_mecanismo: getMecanismoHandler,
  update_mecanismo: updateMecanismoHandler,
  validate_mecanismo: validateMecanismoHandler,
};
