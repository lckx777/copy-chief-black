# Guia de Uso Consistente do Ecossistema de Copywriting v4.9

## TL;DR (Resumo Rápido)

```bash
# SEMPRE abrir assim:
cd ~/copywriting-ecosystem && claude

# NUNCA abrir assim:
cd ~/copywriting-ecosystem/concursos/hacker && claude  # ❌
```

---

## 1. Regras de Ouro

### Regra #1: SEMPRE Abrir do Mesmo Diretório

```bash
cd ~/copywriting-ecosystem && claude
```

**Por quê?** Claude Code carrega CLAUDE.md do diretório atual. Abrir de locais diferentes = instruções diferentes = contexto bagunçado.

### Regra #2: Nunca Extrair ZIP Dentro do Ecossistema

```bash
# ✅ CORRETO
cd ~/Desktop && unzip ecossistema-vXX-installer.zip

# ❌ INCORRETO (cria duplicados)
cd ~/copywriting-ecosystem && unzip *.zip
```

### Regra #3: Manter Apenas 1 Installer

Após atualização, deletar installers antigos:
```bash
rm ~/Desktop/ecossistema-v{versoes_antigas}*.zip
# Manter apenas a versão atual
```

---

## 2. Hierarquia de Contexto

```
~/.claude/CLAUDE.md              ← GLOBAL (sempre carregado, AUTORITATIVO)
    ↓
~/copywriting-ecosystem/CLAUDE.md    ← PROJETO (carregado se abrir daqui)
    ↓
{nicho}/CLAUDE.md                    ← NICHO (OPCIONAL, não recomendado)
    ↓
{oferta}/CLAUDE.md                   ← OFERTA (OPCIONAL, não recomendado)
```

**Recomendação:** Concentrar instruções APENAS em `~/.claude/CLAUDE.md`.

---

## 3. Estrutura de Diretórios v4.9

```
~/copywriting-ecosystem/
├── {nicho}/                         ← Pasta do nicho (concursos, saude, etc)
│   ├── biblioteca_nicho_*.md        ← VOC consolidada do nicho
│   └── {oferta}/                    ← Pasta da oferta
│       ├── research/
│       │   ├── voc/
│       │   │   ├── raw/             ← Nunca carregar no contexto
│       │   │   ├── processed/       ← Carregar quando necessário
│       │   │   ├── summary.md       ← SEMPRE carregar primeiro (≤500 tokens)
│       │   │   └── trends-analysis.md
│       │   ├── competitors/
│       │   ├── mechanism/
│       │   └── avatar/
│       ├── briefings/
│       │   ├── phases/              ← 10 fases HELIX
│       │   └── validations/         ← copy-critic verdicts
│       ├── production/
│       │   ├── vsl/ ou landing-page/
│       │   ├── creatives/
│       │   └── emails/
│       ├── reviews/
│       ├── task_plan.md
│       ├── findings.md
│       └── progress.md
├── templates/
├── task_plan.md                     ← Planejamento global
├── findings.md
└── progress.md
```

---

## 4. Onde Armazenar Cada Tipo de Contexto

| Tipo | Localização | Carregamento |
|------|-------------|--------------|
| Instruções globais | `~/.claude/CLAUDE.md` | Automático |
| Skills/Agentes | `~/.claude/skills/` | On-demand |
| Templates | `~/.claude/templates/` | Referência manual |
| Memória entre sessões | claude-mem plugin | Automático |
| Planejamento global | `~/copywriting-ecosystem/task_plan.md` | Manual |
| Planejamento oferta | `{oferta}/task_plan.md` | Manual |
| Pesquisa VOC | `{oferta}/research/voc/summary.md` | Carregar primeiro |
| Briefing HELIX | `{oferta}/briefings/phases/` | Por fase |
| Produção | `{oferta}/production/` | Gerar aqui |

---

## 5. Workflow de Início de Sessão

```
1. Abrir terminal
2. cd ~/copywriting-ecosystem
3. claude
4. Ler task_plan.md global
5. Verificar qual oferta está em andamento
6. Ler task_plan.md da oferta específica
7. Continuar trabalho
```

---

## 6. Workflow de Atualização do Ecossistema

```bash
# 1. Backup
cp -r ~/copywriting-ecosystem ~/copywriting-ecosystem-backup-$(date +%Y%m%d)

# 2. Extrair novo installer no Desktop
cd ~/Desktop && unzip ecossistema-vXX-installer.zip

# 3. Copiar APENAS templates/configs atualizados
# NÃO substituir todo o diretório (perderia seu trabalho)

# 4. Deletar backup após confirmar que tudo funciona
rm -rf ~/copywriting-ecosystem-backup-*
```

---

## 7. Checklist de Manutenção Semanal

- [ ] Verificar duplicados: `find ~/copywriting-ecosystem -name "copywriting-ecosystem" -type d`
- [ ] Atualizar task_plan.md com status real
- [ ] Fazer commit: `cd ~/copywriting-ecosystem && git add . && git commit -m "weekly update"`
- [ ] Verificar versão do ecossistema vs installer
- [ ] Limpar arquivos temporários em `raw/`

---

## 8. Comandos de Diagnóstico

```bash
# Verificar estrutura
ls -la ~/copywriting-ecosystem/

# Verificar ofertas ativas
ls ~/copywriting-ecosystem/concursos/

# Verificar se há duplicados
find ~/copywriting-ecosystem -name "copywriting-ecosystem" -type d

# Verificar versão do installer
ls ~/Desktop/ecossistema-v*.zip

# Verificar tamanho do ecossistema
du -sh ~/copywriting-ecosystem/
```

---

## 9. Troubleshooting

### Problema: "Contexto diferente do esperado"
**Causa:** Abriu Claude Code de diretório errado
**Solução:** Fechar e reabrir com `cd ~/copywriting-ecosystem && claude`

### Problema: "Diretórios duplicados aparecendo"
**Causa:** Extraiu ZIP dentro do ecossistema
**Solução:**
```bash
rm -rf ~/copywriting-ecosystem/copywriting-ecosystem/
```

### Problema: "task_plan.md desatualizado"
**Causa:** Não atualizou após progresso
**Solução:** Ler status real das ofertas e atualizar manualmente

### Problema: "Instruções conflitantes"
**Causa:** Múltiplos CLAUDE.md com conteúdo diferente
**Solução:** Concentrar tudo em `~/.claude/CLAUDE.md`, limpar os outros

---

## 10. Versões Canônicas

| Componente | Versão | Localização |
|------------|--------|-------------|
| Ecossistema | v4.9 | `~/.claude/CLAUDE.md` |
| Ads Library Spy | v4.9 | Mesmo arquivo |
| VOC Quality Protocol | v4.2 | Mesmo arquivo |
| trends-analysis | v2.0 | `~/.claude/templates/` |
| Installer | v4.9 | `~/Desktop/ecossistema-v49-installer.zip` |

---

## 11. Skills Disponíveis

| Trigger | Skill | Função |
|---------|-------|--------|
| VOC, audience, pesquisa | audience-research-agent | Pesquisa de público |
| helix, briefing, fases | helix-system-agent | Briefing estratégico |
| criativo, hook, anúncio | criativos-agent | Produção de ads |
| LP, landing, página | landing-page-agent | Landing pages |
| validar, testar, criticar | copy-critic | Validação adversarial |
| fragmentar, dividir, RAG | fragment-agent | Otimização para Projects |
| prompt, setup, agente | ai-setup-architect | Meta-arquitetura |

---

## 12. Slash Commands

| Comando | Função |
|---------|--------|
| `/helix-parallel [offer]` | Pesquisa sequencial (4 módulos) |
| `/squad-research [offer]` | Pesquisa paralela via claude-squad |
| `/produce-offer [offer]` | Produção paralela (4 módulos) |
| `/review-all [offer]` | Review multi-model |
| `/create-offer [offer]` | Criar estrutura nova oferta |
| `/update-ecosystem` | Atualizar installer |

---

*Guia criado: 2026-01-21*
*Versão: v4.9*
