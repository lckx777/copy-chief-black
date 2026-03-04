#!/bin/bash
# discover-offer-context.sh - Descoberta dinâmica de contexto (v6.1 MACRO + Recovery)
# Parte do ecossistema v6.0 - Pattern-Based Auto-Discovery + Session Recovery
#
# Funciona de QUALQUER diretório:
# - Da raiz: auto-descobre TODAS as ofertas
# - De um subdiretório: mostra contexto específico da oferta
#
# MACRO PRINCIPLE: Descoberta por PADRÕES, não por nomes hardcoded
# Novos arquivos que seguem convenções são descobertos automaticamente
#
# v6.0: Adiciona recovery automático de sessões interrompidas (/clear)
# v6.1: BSSF Fix - Output para stderr, JSON para stdout (Score 8.7, GBS 90%)
#
# Uso: discover-offer-context.sh [diretório]

# Importar helpers (stdout=JSON, stderr=display)
source "$HOME/.claude/hooks/lib/hook-helpers.sh" 2>/dev/null || {
    # Fallback inline se lib não existir
    display() { echo "$@" >&2; }
    respond() { echo "${1:-{}}"; }
}

CWD="${1:-$(pwd)}"
ECOSYSTEM_ROOT="$HOME/copywriting-ecosystem"
RECOVERY_DIR="$HOME/.claude/session-state/recovery"
RECOVERY_LATEST="$RECOVERY_DIR/latest"

# === RECOVERY CHECK (v6.0) ===
# Verificar se há recovery disponível de sessão anterior
check_recovery() {
    if [[ -d "$RECOVERY_LATEST" ]] && [[ -f "$RECOVERY_LATEST/recovery-metadata.json" ]]; then
        # Ler metadata do recovery
        RECOVERY_TIMESTAMP=$(python3 -c "
import json
with open('$RECOVERY_LATEST/recovery-metadata.json') as f:
    data = json.load(f)
    print(data.get('timestamp', 'desconhecido'))
" 2>/dev/null)
        RECOVERY_SUMMARY=$(python3 -c "
import json
with open('$RECOVERY_LATEST/recovery-metadata.json') as f:
    data = json.load(f)
    print(data.get('summary', 'Sem resumo'))
" 2>/dev/null)
        RECOVERY_TRIGGER=$(python3 -c "
import json
with open('$RECOVERY_LATEST/recovery-metadata.json') as f:
    data = json.load(f)
    print(data.get('trigger', 'desconhecido'))
" 2>/dev/null)
        RECOVERY_SOURCE=$(python3 -c "
import json
with open('$RECOVERY_LATEST/recovery-metadata.json') as f:
    data = json.load(f)
    print(data.get('sourceDir', 'desconhecido'))
" 2>/dev/null)

        # Verificar se o recovery é recente (menos de 24h)
        RECOVERY_TS=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${RECOVERY_TIMESTAMP%.*}" "+%s" 2>/dev/null || echo "0")
        NOW_TS=$(date "+%s")
        HOURS_AGO=$(( (NOW_TS - RECOVERY_TS) / 3600 ))

        if [[ $HOURS_AGO -lt 24 ]]; then
            display ""
            display "╔════════════════════════════════════════════════════════════════╗"
            display "║  🔄 RECOVERY DISPONÍVEL - Sessão anterior interrompida         ║"
            display "╠════════════════════════════════════════════════════════════════╣"
            display "║                                                                ║"
            display "║  Trigger: $RECOVERY_TRIGGER (há ${HOURS_AGO}h)                             "
            display "║  Source: ${RECOVERY_SOURCE: -50}                               "
            display "║  Summary: ${RECOVERY_SUMMARY:0:52}                             "
            display "║                                                                ║"
            display "║  Arquivos salvos:                                              ║"

            # Listar arquivos no recovery
            for FILE in "$RECOVERY_LATEST"/*.md "$RECOVERY_LATEST"/*.json; do
                if [[ -f "$FILE" ]]; then
                    FILENAME=$(basename "$FILE")
                    display "║    - $FILENAME                                              "
                fi
            done

            display "║                                                                ║"
            display "║  PARA RESTAURAR:                                               ║"
            display "║    1. Copiar arquivos: cp $RECOVERY_LATEST/*.md .              ║"
            display "║    2. Ou ler manualmente: Read $RECOVERY_LATEST/task_plan.md  ║"
            display "║                                                                ║"
            display "║  PARA IGNORAR: Os arquivos serão limpos automaticamente.      ║"
            display "╚════════════════════════════════════════════════════════════════╝"
            display ""

            return 0  # Recovery disponível
        fi
    fi
    return 1  # Sem recovery
}

# Executar check de recovery
check_recovery

display "# Contexto da Oferta - Descoberta Dinâmica"
display ""
display "Diretório: $CWD"
display "Data: $(date '+%Y-%m-%d %H:%M')"
display ""

# === FUNÇÃO: Descobrir arquivos por padrão semântico ===
discover_by_pattern() {
    local BASE_PATH="$1"
    local PATTERN="$2"
    local LABEL="$3"

    local FILES=$(find "$BASE_PATH" -maxdepth 2 -type f -iname "$PATTERN" 2>/dev/null | head -5)
    if [[ -n "$FILES" ]]; then
        display "$FILES" | while read f; do
            local REL_PATH="${f#$BASE_PATH/}"
            local LINES=$(wc -l < "$f" 2>/dev/null | tr -d ' ')
            display "- [x] $REL_PATH ($LINES linhas)"
        done
        return 0
    fi
    return 1
}

# === FUNÇÃO: Contar arquivos por padrão ===
count_by_pattern() {
    local BASE_PATH="$1"
    local PATTERN="$2"
    find "$BASE_PATH" -type f -iname "$PATTERN" 2>/dev/null | wc -l | tr -d ' '
}

# === MODO 1: Dentro de uma oferta específica ===
if [[ "$CWD" =~ copywriting-ecosystem/([^/]+)/([^/]+) ]]; then
    NICHO="${BASH_REMATCH[1]}"
    OFERTA="${BASH_REMATCH[2]}"
    OFFER_PATH="$ECOSYSTEM_ROOT/$NICHO/$OFERTA"

    display "## Modo: Oferta Específica"
    display "- Nicho: $NICHO"
    display "- Oferta: $OFERTA"
    display ""

    # TIER 0: Task Plan (SINGLE SOURCE OF TRUTH para "o que fazer agora")
    display "## ⚠️ TASK PLAN (AUTORITATIVO)"
    TASK_PLAN="$OFFER_PATH/task_plan.md"
    if [[ -f "$TASK_PLAN" ]]; then
        # Extrair Current Phase
        CURRENT_PHASE=$(grep -A5 "^## Current Phase" "$TASK_PLAN" 2>/dev/null | head -6)
        if [[ -n "$CURRENT_PHASE" ]]; then
            display "$CURRENT_PHASE"
            display ""
        fi

        # Extrair Foco se existir
        FOCO=$(grep "^\*\*Foco:\*\*" "$TASK_PLAN" 2>/dev/null | head -1)
        if [[ -n "$FOCO" ]]; then
            display "$FOCO"
            display ""
        fi

        # Extrair Reboot Checklist se existir
        REBOOT=$(grep -A10 "^## ⚠️ REBOOT CHECKLIST" "$TASK_PLAN" 2>/dev/null | head -10)
        if [[ -n "$REBOOT" ]]; then
            display "$REBOOT"
            display ""
        fi

        display "**AÇÃO:** Seguir instruções acima ANTES de executar qualquer tarefa."
        display ""
    else
        display "- [ ] task_plan.md não encontrado (usar /planning-with-files para criar)"
        display ""
    fi

    # TIER 1: Contexto Canônico
    display "## TIER 1: Contexto Canônico"
    CANONICAL_FOUND=0

    # CONTEXT.md ou variantes
    for PATTERN in "CONTEXT.md" "*CONTEXT*.md" "context.md"; do
        if discover_by_pattern "$OFFER_PATH" "$PATTERN" "context"; then
            CANONICAL_FOUND=1
            break
        fi
    done

    # project_state.yaml ou variantes
    for PATTERN in "project_state.yaml" "*.state.yaml" "state.yaml"; do
        if discover_by_pattern "$OFFER_PATH" "$PATTERN" "state"; then
            CANONICAL_FOUND=1
            break
        fi
    done

    [[ "$CANONICAL_FOUND" -eq 0 ]] && display "- [ ] Nenhum arquivo canônico encontrado"
    display ""

    # TIER 2: Synthesis
    display "## TIER 2: Síntese"
    if [[ -f "$OFFER_PATH/research/synthesis.md" ]]; then
        display "- [x] research/synthesis.md ($(wc -l < "$OFFER_PATH/research/synthesis.md" | tr -d ' ') linhas)"
    else
        display "- [ ] research/synthesis.md (não encontrado)"
    fi
    display ""

    # TIER 3: Summaries (expandido com padrões)
    display "## TIER 3: Summaries & Sínteses"
    SUMMARY_FOUND=0

    # Padrão 1: */summary.md
    find "$OFFER_PATH/research" -name "summary.md" 2>/dev/null | while read f; do
        CATEGORY=$(dirname "$f" | xargs basename)
        LINES=$(wc -l < "$f" | tr -d ' ')
        display "- [x] research/$CATEGORY/summary.md ($LINES linhas)"
        SUMMARY_FOUND=1
    done

    # Padrão 2: *-summary.md (nomenclatura alternativa)
    find "$OFFER_PATH/research" -name "*-summary.md" 2>/dev/null | while read f; do
        REL="${f#$OFFER_PATH/}"
        LINES=$(wc -l < "$f" | tr -d ' ')
        display "- [x] $REL ($LINES linhas)"
    done

    # Padrão 3: *-synthesis.md (sínteses especializadas)
    find "$OFFER_PATH/research" -name "*-synthesis.md" 2>/dev/null | while read f; do
        REL="${f#$OFFER_PATH/}"
        LINES=$(wc -l < "$f" | tr -d ' ')
        display "- [x] $REL ($LINES linhas)"
    done

    SUMMARY_COUNT=$(find "$OFFER_PATH/research" \( -name "summary.md" -o -name "*-summary.md" -o -name "*-synthesis.md" \) 2>/dev/null | wc -l | tr -d ' ')
    [[ "$SUMMARY_COUNT" -eq 0 ]] && display "- [ ] Nenhum summary encontrado"
    display ""

    # TIER 4: Briefings HELIX
    display "## TIER 4: Briefings HELIX"
    if [[ -d "$OFFER_PATH/briefings/phases" ]]; then
        find "$OFFER_PATH/briefings/phases" -name "*.md" -not -name "CLAUDE.md" 2>/dev/null | sort | while read f; do
            PHASE=$(basename "$f" .md)
            display "- [x] briefings/phases/$PHASE.md"
        done
    else
        display "- [ ] Nenhum briefing encontrado"
    fi
    display ""

    # TIER 5: Knowledge Files (descoberta por padrões semânticos)
    display "## TIER 5: Knowledge Files"
    KNOWLEDGE_FOUND=0

    # Mapeamentos/Funcionalidades/Features (usando sort -u para evitar duplicatas)
    find "$OFFER_PATH" -maxdepth 2 -type f \( -iname "*Mapeamento*.md" -o -iname "*Funcionalidades*.md" -o -iname "*Features*.md" \) 2>/dev/null | sort -u | while read f; do
        REL="${f#$OFFER_PATH/}"
        LINES=$(wc -l < "$f" | tr -d ' ')
        display "- [x] $REL ($LINES linhas) [FEATURES MAP]"
        KNOWLEDGE_FOUND=1
    done

    # Auditorias
    find "$OFFER_PATH" -maxdepth 3 -type f -iname "AUDITORIA*.md" 2>/dev/null | while read f; do
        REL="${f#$OFFER_PATH/}"
        LINES=$(wc -l < "$f" | tr -d ' ')
        display "- [x] $REL ($LINES linhas) [AUDIT]"
        KNOWLEDGE_FOUND=1
    done

    # Consolidados (*-complete.md)
    find "$OFFER_PATH" -maxdepth 3 -type f -name "*-complete.md" 2>/dev/null | while read f; do
        REL="${f#$OFFER_PATH/}"
        LINES=$(wc -l < "$f" | tr -d ' ')
        display "- [x] $REL ($LINES linhas) [CONSOLIDATED]"
        KNOWLEDGE_FOUND=1
    done

    # Depoimentos/Testimonials
    for PATTERN in "*depoimentos*" "*testimonials*" "*social-proof*"; do
        find "$OFFER_PATH" -maxdepth 4 -type f -iname "${PATTERN}.md" 2>/dev/null | while read f; do
            REL="${f#$OFFER_PATH/}"
            LINES=$(wc -l < "$f" | tr -d ' ')
            display "- [x] $REL ($LINES linhas) [SOCIAL PROOF]"
            KNOWLEDGE_FOUND=1
        done
    done

    # Validações
    find "$OFFER_PATH/briefings/validations" -type f -name "*.md" 2>/dev/null | head -3 | while read f; do
        REL="${f#$OFFER_PATH/}"
        LINES=$(wc -l < "$f" | tr -d ' ')
        display "- [x] $REL ($LINES linhas) [VALIDATION]"
        KNOWLEDGE_FOUND=1
    done

    KNOWLEDGE_COUNT=$(find "$OFFER_PATH" -maxdepth 4 -type f \( -iname "*Mapeamento*.md" -o -iname "*Funcionalidades*.md" -o -iname "AUDITORIA*.md" -o -name "*-complete.md" -o -iname "*depoimentos*.md" \) 2>/dev/null | wc -l | tr -d ' ')
    [[ "$KNOWLEDGE_COUNT" -eq 0 ]] && display "- [ ] Nenhum knowledge file encontrado"
    display ""

    # TIER 6: Production Assets (contagem)
    display "## TIER 6: Production"
    if [[ -d "$OFFER_PATH/production" ]]; then
        VSL_COUNT=$(find "$OFFER_PATH/production" -path "*vsl*" -name "*.md" -not -name "CLAUDE.md" 2>/dev/null | wc -l | tr -d ' ')
        LP_COUNT=$(find "$OFFER_PATH/production" -path "*landing*" -name "*.md" -not -name "CLAUDE.md" 2>/dev/null | wc -l | tr -d ' ')
        CREATIVE_COUNT=$(find "$OFFER_PATH/production" -path "*creative*" -name "*.md" -not -name "CLAUDE.md" 2>/dev/null | wc -l | tr -d ' ')
        EMAIL_COUNT=$(find "$OFFER_PATH/production" \( -path "*email*" -o -path "*webinario*" \) -name "*.md" -not -name "CLAUDE.md" 2>/dev/null | wc -l | tr -d ' ')
        TOTAL_PROD=$(find "$OFFER_PATH/production" -name "*.md" -not -name "CLAUDE.md" 2>/dev/null | wc -l | tr -d ' ')

        display "- VSL: $VSL_COUNT arquivos"
        display "- Landing Page: $LP_COUNT arquivos"
        display "- Criativos: $CREATIVE_COUNT arquivos"
        display "- Emails/Webinário: $EMAIL_COUNT arquivos"
        display "- **Total Production: $TOTAL_PROD arquivos**"
    else
        display "- [ ] Diretório production/ não encontrado"
    fi
    display ""

    # TIER 7: Referências (materiais originais, swipes)
    display "## TIER 7: Referências"
    REFS_COUNT=0

    if [[ -d "$OFFER_PATH/_materiais_originais" ]]; then
        COUNT=$(find "$OFFER_PATH/_materiais_originais" -type f 2>/dev/null | wc -l | tr -d ' ')
        display "- _materiais_originais/: $COUNT arquivos"
        REFS_COUNT=$((REFS_COUNT + COUNT))
    fi

    if [[ -d "$OFFER_PATH/swipes-adapta-org" ]]; then
        COUNT=$(find "$OFFER_PATH/swipes-adapta-org" -type f 2>/dev/null | wc -l | tr -d ' ')
        display "- swipes-adapta-org/: $COUNT arquivos"
        REFS_COUNT=$((REFS_COUNT + COUNT))
    fi

    [[ "$REFS_COUNT" -eq 0 ]] && display "- [ ] Nenhuma referência encontrada"
    display ""

    display "## Recomendacao de Loading"
    display "0. **TIER 0: TASK PLAN - Ler Current Phase + Foco ANTES de qualquer ação**"
    display "1. TIER 1: Ler CONTEXT.md se existir (fonte da verdade)"
    display "2. TIER 2: Ler synthesis.md (visão geral)"
    display "3. TIER 5: Ler knowledge files relevantes (Mapeamento, Auditorias)"
    display "4. TIER 3-4: Summaries e Briefings conforme necessário"
    exit 0
fi

# === MODO 2: Da raiz do ecossistema (auto-discovery) ===
display "## Modo: Ecossistema (auto-discovery)"
display ""

# Auto-descobrir ofertas por estrutura (MACRO: todos nichos, não hardcoded)
# Detecta ofertas por presença de CONTEXT.md, helix-state.yaml, ou CLAUDE.md
OFFER_COUNT=0
STANDBY_COUNT=0
for OFFER_DIR in $(find "$ECOSYSTEM_ROOT" -mindepth 2 -maxdepth 2 -type d 2>/dev/null | sort); do
    # Skip non-offer directories
    DIR_NAME=$(basename "$OFFER_DIR")
    PARENT_NAME=$(basename "$(dirname "$OFFER_DIR")")
    case "$PARENT_NAME" in
        .claude|.git|node_modules|scripts|site|swipes|export|templates|tool-results) continue ;;
    esac
    case "$DIR_NAME" in
        .*|node_modules) continue ;;
    esac

    # Must have at least one offer marker
    [[ ! -f "$OFFER_DIR/CONTEXT.md" ]] && [[ ! -f "$OFFER_DIR/helix-state.yaml" ]] && [[ ! -f "$OFFER_DIR/CLAUDE.md" ]] && continue

    OFFER_PATH="$OFFER_DIR"
    OFFER_NAME="$DIR_NAME"
    NICHO_NAME="$PARENT_NAME"

    # Check status from project_state.yaml
    OFFER_STATUS="active"
    if [[ -f "$OFFER_PATH/project_state.yaml" ]]; then
        STATUS_LINE=$(grep -m1 "^status:" "$OFFER_PATH/project_state.yaml" 2>/dev/null)
        if [[ "$STATUS_LINE" =~ standby ]]; then
            OFFER_STATUS="standby"
            STANDBY_COUNT=$((STANDBY_COUNT + 1))
        elif [[ "$STATUS_LINE" =~ archived ]]; then
            OFFER_STATUS="archived"
            continue  # Skip archived entirely
        fi
    fi

    # Verificar se é oferta real (tem research/ ou briefings/ ou production/)
    if [[ -d "$OFFER_PATH/research" ]] || [[ -d "$OFFER_PATH/briefings" ]] || [[ -d "$OFFER_PATH/production" ]]; then
        OFFER_COUNT=$((OFFER_COUNT + 1))

        # Determinar fase atual
        PHASE="?"
        HAS_SYNTHESIS="[ ]"
        HAS_BRIEFING="[ ]"
        HAS_PRODUCTION="[ ]"
        HAS_CONTEXT="[ ]"
        HAS_KNOWLEDGE="[ ]"

        # Canonical context
        [[ -f "$OFFER_PATH/CONTEXT.md" ]] && HAS_CONTEXT="[x]"

        [[ -f "$OFFER_PATH/research/synthesis.md" ]] && HAS_SYNTHESIS="[x]" && PHASE="Research DONE"
        BRIEFING_COUNT=$(find "$OFFER_PATH/briefings/phases" -name "*.md" -not -name "CLAUDE.md" 2>/dev/null | wc -l | tr -d ' ')
        [[ "$BRIEFING_COUNT" -gt 0 ]] && HAS_BRIEFING="[x]" && PHASE="Briefing ($BRIEFING_COUNT fases)"
        PRODUCTION_COUNT=$(find "$OFFER_PATH/production" -name "*.md" -not -name "CLAUDE.md" 2>/dev/null | wc -l | tr -d ' ')
        [[ "$PRODUCTION_COUNT" -gt 0 ]] && HAS_PRODUCTION="[x]" && PHASE="Production ($PRODUCTION_COUNT files)"

        # Knowledge files count
        KNOWLEDGE_COUNT=$(find "$OFFER_PATH" -maxdepth 3 -type f \( -iname "*Mapeamento*.md" -o -iname "*Funcionalidades*.md" -o -iname "AUDITORIA*.md" -o -name "*-complete.md" \) 2>/dev/null | wc -l | tr -d ' ')
        [[ "$KNOWLEDGE_COUNT" -gt 0 ]] && HAS_KNOWLEDGE="[x]"

        # Summary compacto
        SUMMARY_COUNT=$(find "$OFFER_PATH/research" \( -name "summary.md" -o -name "*-summary.md" -o -name "*-synthesis.md" \) 2>/dev/null | wc -l | tr -d ' ')

        if [[ "$OFFER_STATUS" == "standby" ]]; then
            display "### ⏸️ $NICHO_NAME/$OFFER_NAME [STANDBY]"
            display "- Fase: $PHASE (pausada)"
            display ""
        else
            display "### $NICHO_NAME/$OFFER_NAME"
            display "- $HAS_CONTEXT Context | $HAS_SYNTHESIS Synthesis | $HAS_BRIEFING Briefing | $HAS_PRODUCTION Production"
            display "- Summaries: $SUMMARY_COUNT | Knowledge: $KNOWLEDGE_COUNT | Briefings: $BRIEFING_COUNT | Production: $PRODUCTION_COUNT"
            display "- Fase: $PHASE"
            display ""
        fi
    fi
done

if [[ "$OFFER_COUNT" -eq 0 ]]; then
    display "Nenhuma oferta encontrada no ecossistema."
    display ""
fi

ACTIVE_COUNT=$((OFFER_COUNT - STANDBY_COUNT))
display "## Ofertas: $ACTIVE_COUNT ativas, $STANDBY_COUNT standby (total: $OFFER_COUNT)"
display ""

# Swipes disponíveis por nicho
display "## Swipes Disponíveis"
for NICHO_DIR in $(find "$HOME/.claude/skills/criativos-agent/references/swipe-files" -maxdepth 1 -type d 2>/dev/null | tail -n +2); do
    NICHO_NAME=$(basename "$NICHO_DIR")
    SWIPE_COUNT=$(find "$NICHO_DIR" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    display "- $NICHO_NAME: $SWIPE_COUNT swipes"
done
display ""

# Path-specific rules carregadas
display "## Rules por Oferta"
RULES_DIR="$ECOSYSTEM_ROOT/.claude/rules/offers"
if [[ -d "$RULES_DIR" ]]; then
    for RULE in $(find "$RULES_DIR" -name "*.md" -not -name "CLAUDE.md" 2>/dev/null | sort); do
        display "- $(basename "$RULE" .md)"
    done
else
    display "- Nenhuma rule de oferta encontrada"
fi
display ""

display "## Recomendacao"
display "Para trabalhar em uma oferta, diga: 'trabalhar na [nome-da-oferta]'"
display "Claude carregara CONTEXT.md + synthesis.md + knowledge files automaticamente."
display "Padroes descobertos: *CONTEXT*.md, *Mapeamento*.md, AUDITORIA*.md, *-complete.md"

# Resposta JSON para Claude Code (stdout)
respond '{}'
