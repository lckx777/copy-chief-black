---
description: Execute research modules in parallel via claude-squad
argument-hint: "<offer-name> [nicho]"
---

# Squad Research (Parallel VOC Extraction)

> ⚠️ **POWER USER ONLY (v6.2):** Este command requer setup avançado.
> **RECOMENDADO:** `audience-research-agent` para a maioria dos casos.
> Ver `~/.claude/WORKFLOW-CANONICO.md` para o fluxo padrão.
>
> **Pré-requisitos:**
> - tmux instalado (`brew install tmux`)
> - gh autenticado (`gh auth login`)
> - claude-squad instalado (`brew install claude-squad`)
>
> **Quando usar:**
> - Múltiplas ofertas simultaneamente
> - Deadline crítico (speedup 2-3x)
> - Budget de tokens não é concern (4×200k = 800k)

Execute parallel research for: **$ARGUMENTS**

⚡ **SPEEDUP:** 90-180min → 30-60min (2-3x faster)

## Pre-Flight Checks

```bash
which tmux         # ✓ Tmux installed
gh auth status     # ✓ GitHub authenticated
cs version         # ✓ Claude-squad available
```

## Execution

```bash
# Run wrapper script
cd ~/copywriting-ecosystem
./parallel-research.sh $ARGUMENTS
```

## Manual Steps (After Script)

### 1. Open claude-squad TUI
```bash
cd ~/copywriting-ecosystem/[nicho]/[offer]
cs
```

### 2. Create 4 sessions (press 'n' four times)
- `youtube-extraction`
- `instagram-extraction`
- `tiktok-extraction`
- `br-sources-extraction`

### 3. For EACH session:
a) Select session (arrow keys ↑/↓)
b) Press `Enter` to attach
c) Paste task prompt from `/tmp/squad-tasks/[module].txt`
d) Press `Ctrl+b`, then `d` to detach

### 4. Monitor completion (separate terminal)
```bash
watch -n 5 'ls -lh ~/copywriting-ecosystem/*/[offer]/research/voc/*/summary.md'
```

### 5. When ALL 4 complete, check quality gates:
- [ ] All 4 summary.md exist
- [ ] Token count ≤500 each
- [ ] Confidence ≥70% in each module
- [ ] No extraction errors in logs

## Synthesis

After all 4 modules complete:
```bash
/agent synthesizer "
OFFER: [offer-name]
TASK: Merge research outputs
INPUTS:
  - research/voc/youtube/summary.md
  - research/voc/instagram/summary.md
  - research/voc/tiktok/summary.md
  - research/voc/br-sources/summary.md
OUTPUT: research/voc/synthesis.md (≤15K tokens)
"
```

## Troubleshooting

### Sessions não iniciam
```bash
tmux ls                    # Ver sessions ativas
tmux kill-session -t [name] # Matar órfãs
```

### Worktrees corrompidos
```bash
git worktree list          # Listar worktrees
git worktree prune         # Limpar órfãs
```

### Output structure quebrada
```bash
ls -la research/voc/       # Verificar permissions
cat /tmp/squad-tasks/*.txt # Confirmar paths absolutos
```

## Rollback

Se necessário, use modo sequencial:
```bash
/helix-parallel [offer]  # Modo original (90-180min)
```

## Tips

- **First time:** Espere setup de worktrees (~2-3min por session)
- **Token usage:** 4×200k = 800k tokens em paralelo
- **Best for:** Time-critical research, multiple offers
- **Not for:** Single module, token budget concerns
