#!/bin/bash
# analyze-production-task.sh - Analisa task de produção
# Chamado por UserPromptSubmit hook
# Exit 0 = permite (pode imprimir reminder)
# Exit 2 = bloqueia (não usado aqui)

# Recebe prompt via stdin (JSON)
INPUT=$(cat)

# Extrair o prompt do JSON
PROMPT=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('prompt',''))" 2>/dev/null || echo "")

# Se não conseguiu extrair, tentar direto
if [[ -z "$PROMPT" ]]; then
    PROMPT="$INPUT"
fi

CWD=$(pwd)

# Detectar se é task de produção
if echo "$PROMPT" | grep -qiE "(criativo|copy|VSL|LP|landing|email sequence|produzir|produção)"; then

    # Verificar se estamos em diretório de oferta
    if [[ -d "$CWD/research" ]] || [[ -d "$CWD/briefings" ]]; then

        # Contar research disponível
        RESEARCH_COUNT=$(find "$CWD/research" -name "summary.md" 2>/dev/null | wc -l | tr -d ' ')
        BRIEFING_COUNT=$(find "$CWD/briefings/phases" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')

        if [[ "$RESEARCH_COUNT" -eq 0 && "$BRIEFING_COUNT" -eq 0 ]]; then
            # Imprimir reminder (será mostrado ao Claude)
            echo "REMINDER: Produção detectada em oferta sem research."
            echo "Considere rodar audience-research-agent ou helix-system-agent primeiro."
        elif [[ "$RESEARCH_COUNT" -lt 2 ]]; then
            echo "REMINDER: Research incompleto ($RESEARCH_COUNT summaries)."
            echo "Lembre de carregar o contexto da oferta antes de produzir."
        fi
    fi
fi

# Sempre permite (exit 0), apenas mostra reminders
exit 0
