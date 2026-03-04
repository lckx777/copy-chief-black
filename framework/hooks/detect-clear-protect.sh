#!/bin/bash
# ~/.claude/hooks/detect-clear-protect.sh
# v1.0 - Multi-Layer Persistence Protocol (BSSF Solution #5)
# Score: 8.3/10, GBS: 90%
#
# Hook UserPromptSubmit que detecta /clear e força salvamento de estado
# antes do clear executar.
#
# Este hook NÃO bloqueia o /clear, apenas salva estado antes.

# Ler input do hook (JSON com prompt)
INPUT=$(cat)

# Extrair o prompt do usuário
# UserPromptSubmit recebe: { "prompt": "..." }
PROMPT=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('prompt', ''))
except:
    print('')
" 2>/dev/null)

# Detectar /clear no início do prompt (case insensitive)
if echo "$PROMPT" | grep -qi "^/clear"; then
    echo "" >&2
    echo "╔════════════════════════════════════════════════════════════════╗" >&2
    echo "║  🔄 /clear DETECTADO - Salvando estado da sessão...           ║" >&2
    echo "╚════════════════════════════════════════════════════════════════╝" >&2
    echo "" >&2

    # Chamar save-session-state.ts para salvar estado
    if command -v bun &> /dev/null; then
        bun run "$HOME/.claude/hooks/save-session-state.ts" "clear" 2>&1 | while read -r line; do
            echo "$line" >&2
        done
    else
        echo "[DETECT-CLEAR] ⚠️ bun não encontrado, usando fallback..." >&2

        # Fallback: salvar arquivos manualmente
        RECOVERY_DIR="$HOME/.claude/session-state/recovery"
        TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
        RECOVERY_SUBDIR="$RECOVERY_DIR/$TIMESTAMP"

        mkdir -p "$RECOVERY_SUBDIR"

        # Copiar planning files se existirem
        for file in task_plan.md findings.md progress.md; do
            if [[ -f "$file" ]]; then
                cp "$file" "$RECOVERY_SUBDIR/"
                echo "[DETECT-CLEAR] ✓ Copiado: $file" >&2
            fi
        done

        # Copiar session state
        STATE_FILE="$HOME/.claude/session-state/current-session.json"
        if [[ -f "$STATE_FILE" ]]; then
            cp "$STATE_FILE" "$RECOVERY_SUBDIR/session-state.json"
            echo "[DETECT-CLEAR] ✓ Copiado: session-state.json" >&2
        fi

        # Criar metadata simples
        cat > "$RECOVERY_SUBDIR/recovery-metadata.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "sourceDir": "$(pwd)",
  "trigger": "clear",
  "summary": "Fallback recovery (bun não disponível)"
}
EOF
        echo "[DETECT-CLEAR] ✓ Metadata salva" >&2

        # Atualizar symlink latest
        rm -f "$RECOVERY_DIR/latest" 2>/dev/null
        ln -s "$RECOVERY_SUBDIR" "$RECOVERY_DIR/latest" 2>/dev/null

        echo "" >&2
        echo "╔════════════════════════════════════════════════════════════════╗" >&2
        echo "║  ✅ ESTADO SALVO (fallback)                                    ║" >&2
        echo "╠════════════════════════════════════════════════════════════════╣" >&2
        echo "║  Na próxima sessão, recovery será oferecido automaticamente.  ║" >&2
        echo "╚════════════════════════════════════════════════════════════════╝" >&2
        echo "" >&2
    fi
fi

# Retornar JSON vazio (não bloqueia)
echo '{}'
exit 0
