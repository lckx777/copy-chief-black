#!/bin/bash
# Hook: helix-phase-mecanismo.sh
#
# Detecta trabalho em Fase 5/6 HELIX e garante:
# 1. mecanismo-unico.yaml existe (cria se não)
# 2. Lembra de usar ferramentas MCP de validação
#
# Trigger: PreToolUse para Write em briefings/

# Get tool input from stdin
TOOL_INPUT=$(cat)

# Extract file_path from JSON input
FILE_PATH=$(echo "$TOOL_INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//' | sed 's/"$//')

# If no file_path, allow
if [[ -z "$FILE_PATH" ]]; then
    echo '{"decision": "allow"}'
    exit 0
fi

# Only check briefings paths
if [[ ! "$FILE_PATH" =~ /briefings/ ]]; then
    echo '{"decision": "allow"}'
    exit 0
fi

# Check if it's Phase 5 or 6
IS_PHASE_5=false
IS_PHASE_6=false

if [[ "$FILE_PATH" =~ fase.?0?5 ]] || [[ "$FILE_PATH" =~ fase5 ]] || [[ "$FILE_PATH" =~ _mup ]] || [[ "$FILE_PATH" =~ problema.*vilao ]]; then
    IS_PHASE_5=true
fi

if [[ "$FILE_PATH" =~ fase.?0?6 ]] || [[ "$FILE_PATH" =~ fase6 ]] || [[ "$FILE_PATH" =~ _mus ]] || [[ "$FILE_PATH" =~ solucao ]]; then
    IS_PHASE_6=true
fi

# If not Phase 5 or 6, allow without action
if [[ "$IS_PHASE_5" == "false" && "$IS_PHASE_6" == "false" ]]; then
    echo '{"decision": "allow"}'
    exit 0
fi

# Find offer root
find_offer_root() {
    local current="$1"
    local max_depth=10
    local depth=0

    while [[ $depth -lt $max_depth ]]; do
        if [[ -f "$current/CONTEXT.md" ]] || [[ -f "$current/mecanismo-unico.yaml" ]]; then
            echo "$current"
            return 0
        fi

        local parent=$(dirname "$current")
        if [[ "$parent" == "$current" ]]; then
            return 1
        fi
        current="$parent"
        ((depth++))
    done

    return 1
}

OFFER_ROOT=$(find_offer_root "$(dirname "$FILE_PATH")")

if [[ -z "$OFFER_ROOT" ]]; then
    echo '{"decision": "allow"}'
    exit 0
fi

MECANISMO_FILE="$OFFER_ROOT/mecanismo-unico.yaml"
OFFER_NAME=$(basename "$OFFER_ROOT")
NICHO=$(basename "$(dirname "$OFFER_ROOT")")

# If mecanismo-unico.yaml doesn't exist, create it from template
if [[ ! -f "$MECANISMO_FILE" ]]; then
    # Create from template
    cat > "$MECANISMO_FILE" << 'YAML_TEMPLATE'
# Mecanismo Unico: [OFFER_NAME]
# Version: 2.0.0
# Schema: ~/.claude/schemas/mecanismo-unico.schema.yaml
# Status: DRAFT (auto-created)
# Migration: v2.0.0 — EN keys (S12.5). Preserved: sexy_cause, gimmick_name

unique_mechanism:
  # ============================================
  # PARTE 1: MUP (Mecanismo Unico do Problema)
  # ============================================
  mup:
    new_cause: ""
    sexy_cause:
      name: ""
      candidates:
        - name: ""
          transmissible: false
          score: 0
        - name: ""
          transmissible: false
          score: 0
        - name: ""
          transmissible: false
          score: 0
    core_problem: ""
    root_cause: ""

  # ============================================
  # PARTE 2: MUS (Mecanismo Unico da Solucao)
  # ============================================
  mus:
    new_opportunity: ""
    hero_ingredient:
      name: ""
      nicho: ""
    gimmick_name:
      name: ""
      candidates:
        - name: ""
          linked_to_hero: false
          sticky: false
          score: 0
      validation:
        linked_to_hero: false
        sticky: false
    origin_story:
      description: ""
      validation:
        credibility: false
        curiosity: false
    authority_hook:
      name: ""
      type: ""

  # ============================================
  # PARTE 3: INDUTOR (Metodo/Produto)
  # ============================================
  indutor:
    system_name:
      name: ""
      validation:
        memorable: false
        distinct_from_competitor: false
        communicates_result: false
    components: []
    activation: ""

  # ============================================
  # GANCHO DA SOLUCAO
  # ============================================
  solution_hook:
    formula: |
      "Ja ouviu falar desse [GIMMICK NAME] que [ORIGIN STORY] estao usando
      secretamente para [DESEJO]? Ja estao chamando isso de [AUTHORITY HOOK]."
    completo: ""

  # ============================================
  # VALIDACAO
  # ============================================
  validation:
    rmbc_scores:
      digestible: 0
      unique: 0
      believable: 0
      connected: 0
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
    offer_name: "[OFFER_NAME]"
    nicho: "[NICHO]"
    created_at: "[DATE]"
    updated_at: "[DATE]"
    version: "2.0.0"
YAML_TEMPLATE

    # Replace placeholders
    DATE=$(date +%Y-%m-%d)
    sed -i '' "s/\[OFFER_NAME\]/$OFFER_NAME/g" "$MECANISMO_FILE"
    sed -i '' "s/\[NICHO\]/$NICHO/g" "$MECANISMO_FILE"
    sed -i '' "s/\[DATE\]/$DATE/g" "$MECANISMO_FILE"

    # Log creation
    echo "[helix-phase-mecanismo] Created mecanismo-unico.yaml for $OFFER_NAME" >&2
fi

# Build reminder message based on phase
PHASE_MSG=""
MCP_REMINDER=""

if [[ "$IS_PHASE_5" == "true" ]]; then
    PHASE_MSG="Fase 5 (MUP) detectada"
    MCP_REMINDER="APOS preencher MUP no briefing, ATUALIZE mecanismo-unico.yaml e execute:
1. consensus (zen) - TOP 3 candidatos MUP
2. blind_critic (copywriting) - MUP Statement (threshold >= 8)"
fi

if [[ "$IS_PHASE_6" == "true" ]]; then
    PHASE_MSG="Fase 6 (MUS) detectada"
    MCP_REMINDER="APOS preencher MUS no briefing, ATUALIZE mecanismo-unico.yaml e execute:
1. blind_critic (copywriting) - MUS Statement (threshold >= 8)
2. emotional_stress_test (copywriting) - MUP+MUS (threshold >= 8)
3. Atualizar state para VALIDATED"
fi

# Allow but with reminder in message
cat << EOF
{
  "decision": "allow",
  "message": "📋 MECANISMO UNICO - $PHASE_MSG

Arquivo canonico: $MECANISMO_FILE

$MCP_REMINDER

Validar: ~/copywriting-ecosystem/scripts/validate-mecanismo.sh $OFFER_ROOT"
}
EOF
exit 0
