#!/bin/bash
# ~/.claude/hooks/lib/hook-helpers.sh
# v1.0 - BSSF Solution #5 (Score 8.7, GBS 90%)
#
# Funções helper para padronizar output de hooks.
# Claude Code espera: stdout=JSON, stderr=display
#
# Uso:
#   source ~/.claude/hooks/lib/hook-helpers.sh
#   display "Mensagem para o usuário"
#   respond '{"status":"ok"}'

# Envia mensagem para exibição ao usuário (stderr)
display() {
    echo "$@" >&2
}

# Envia resposta JSON para Claude Code (stdout)
# Se chamado sem argumento, envia {}
respond() {
    if [[ -n "$1" ]]; then
        echo "$1"
    else
        echo '{}'
    fi
}

# Helper para box formatado
display_box() {
    local title="$1"
    local width=66
    display "╔$(printf '═%.0s' $(seq 1 $width))╗"
    display "║  $title$(printf ' %.0s' $(seq 1 $((width - ${#title} - 3))))║"
    display "╚$(printf '═%.0s' $(seq 1 $width))╝"
}

# Helper para seção com header
display_section() {
    local header="$1"
    display ""
    display "## $header"
}

# Lê JSON de input (stdin) - muitos hooks precisam disso
read_input() {
    cat
}

# Extrai campo de JSON usando python (mais confiável que jq para alguns casos)
json_get() {
    local json="$1"
    local field="$2"
    echo "$json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('$field', ''))
except:
    print('')
" 2>/dev/null
}
