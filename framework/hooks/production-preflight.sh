#!/bin/bash
# production-preflight.sh - Bloqueia produção se research não existe
# Parte do ecossistema v5.0 - Descoberta Dinâmica
#
# Exit codes:
#   0 = OK, pode prosseguir
#   1 = Warning (mostra mas não bloqueia)
#   2 = BLOCKED (impede ação)

CWD="${1:-$(pwd)}"

# Descobrir se estamos em uma oferta (tem research/ ou briefings/)
if [[ ! -d "$CWD/research" && ! -d "$CWD/briefings" ]]; then
    # Não é uma oferta, não bloqueia
    exit 0
fi

# Contar summaries de research disponíveis
RESEARCH_COUNT=$(find "$CWD/research" -name "summary.md" 2>/dev/null | wc -l | tr -d ' ')

# Contar briefings disponíveis
BRIEFING_COUNT=$(find "$CWD/briefings/phases" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')

# Se nenhum research E nenhum briefing, bloquear
if [[ "$RESEARCH_COUNT" -eq 0 && "$BRIEFING_COUNT" -eq 0 ]]; then
    echo "BLOCKED: Oferta detectada mas sem research ou briefings."
    echo "Diretório: $CWD"
    echo ""
    echo "Antes de produzir copy, execute:"
    echo "  1. Research phase (audience-research-agent)"
    echo "  2. Briefing phase (helix-system-agent)"
    exit 2
fi

# Se tem research mas poucos arquivos, warning
if [[ "$RESEARCH_COUNT" -lt 2 ]]; then
    echo "WARNING: Research incompleto ($RESEARCH_COUNT summaries encontrados)"
    echo "Considere completar research antes de produzir."
    echo ""
fi

# Listar o que foi encontrado
echo "Research disponível ($RESEARCH_COUNT summaries):"
find "$CWD/research" -name "summary.md" 2>/dev/null | while read f; do
    # Extrair categoria do path
    CATEGORY=$(dirname "$f" | xargs basename)
    echo "  - $CATEGORY/summary.md"
done

if [[ "$BRIEFING_COUNT" -gt 0 ]]; then
    echo ""
    echo "Briefings disponíveis ($BRIEFING_COUNT fases):"
    find "$CWD/briefings/phases" -name "*.md" 2>/dev/null | while read f; do
        PHASE=$(basename "$f" .md)
        echo "  - $PHASE"
    done
fi

exit 0
