# Backup Strategy - Ecossistema de Copywriting

> Estratégia de proteção de dados em 4 camadas para garantir recuperação em qualquer cenário.

**Versão:** v4.9.7 | **Última atualização:** 2026-01-26

---

## Visão Geral das Camadas

| Camada | Frequência | Tipo | Automático | Retenção |
|--------|------------|------|------------|----------|
| 1. Git | Contínuo | Incremental | Manual | Ilimitada |
| 2. Session State | 2h | Snapshot | ✅ Sim | 24h |
| 3. Export/ZIP | Semanal | Full | Manual | 3 versões |
| 4. Cloud | Mensal | Full | Manual | 3 versões |

---

## Camada 1: Git (Contínuo)

### O que Protege
- Todo o código do ecossistema
- Configurações de ofertas
- Briefings e research
- Scripts e hooks

### Localização
```
~/copywriting-ecosystem/ (repositório principal)
```

### Boas Práticas

**Commits frequentes:**
```bash
# Após cada sessão de trabalho significativa
cd ~/copywriting-ecosystem
git add .
git commit -m "work: [oferta] [descrição breve]"
```

**Nomenclatura de commits:**
| Prefixo | Uso |
|---------|-----|
| `work:` | Trabalho em progresso |
| `feat:` | Nova funcionalidade |
| `fix:` | Correção |
| `docs:` | Documentação |
| `backup:` | Backup manual |

**Backup manual antes de operações arriscadas:**
```bash
git add . && git commit -m "backup: $(date +%Y-%m-%d-%H%M)"
```

### Verificação
```bash
# Status do repositório
git status

# Último commit
git log -1 --oneline

# Verificar se há mudanças não commitadas
git diff --stat
```

---

## Camada 2: Session State (Automático)

### O que Protege
- Estado da sessão atual
- Arquivos lidos na sessão
- Frameworks utilizados
- Reasoning depth

### Localização
```
~/.claude/session-state/current-session.json
```

### Funcionamento
- Hook `session-start.ts` inicializa estado
- Hook `post-tool-use.ts` atualiza após cada operação
- Expiração automática após 2 horas de inatividade

### Estrutura do Estado
```json
{
  "startedAt": "2026-01-26T14:00:00Z",
  "filesRead": ["file1.md", "file2.md"],
  "frameworksUsed": ["STAND", "RMBC"],
  "reasoningDepth": 0.75,
  "toolsUsed": ["Read", "Write", "Grep"]
}
```

### Não Requer Ação Manual
O sistema gerencia automaticamente.

---

## Camada 3: Export/ZIP (Semanal)

### O que Protege
- Ecossistema ~/.claude/ completo
- Skills, commands, hooks, templates
- Documentação e configurações

### Como Gerar

**Via comando:**
```bash
/update-ecosystem
```

**Manualmente:**
```bash
cd ~/.claude
zip -r ~/Desktop/ecossistema-v$(cat .version | head -1)-$(date +%Y%m%d).zip \
  skills/ commands/ hooks/ templates/ docs/ agents/ scripts/ \
  CLAUDE.md ecosystem-status.md .version \
  -x "*.pyc" -x "__pycache__/*" -x ".git/*"
```

### Localização
```
~/Desktop/ecossistema-vX.X.X-YYYYMMDD.zip
```

### Rotina Semanal
- [ ] Segunda-feira: Gerar ZIP
- [ ] Verificar se ZIP foi criado
- [ ] Manter apenas últimas 3 versões

### Limpeza de ZIPs Antigos
```bash
# Listar ZIPs no Desktop
ls -la ~/Desktop/ecossistema-v*.zip

# Manter apenas os 3 mais recentes
ls -t ~/Desktop/ecossistema-v*.zip | tail -n +4 | xargs rm -f
```

---

## Camada 4: Cloud (Mensal)

### O que Protege
- Backup off-site completo
- Proteção contra falha de hardware
- Histórico de longo prazo

### Opções Recomendadas
1. **Google Drive** (15GB grátis)
2. **Dropbox** (2GB grátis)
3. **iCloud** (5GB grátis)

### Rotina Mensal
1. Gerar ZIP via `/update-ecosystem`
2. Upload para cloud storage
3. Verificar integridade do upload
4. Manter 3 versões no cloud

### Estrutura no Cloud
```
/Backups/
  /Claude-Ecosystem/
    ecossistema-v4.9.7-20260126.zip
    ecossistema-v4.9.6-20251226.zip
    ecossistema-v4.9.5-20251126.zip
```

---

## Restauração

### Cenário 1: Perdi uma sessão de trabalho
```bash
# Git restore do último commit
cd ~/copywriting-ecosystem
git checkout .

# Ou restaurar arquivo específico
git checkout HEAD -- path/to/file.md
```

### Cenário 2: Corromi o ecossistema ~/.claude/
```bash
# 1. Backup do estado atual (mesmo corrompido)
mv ~/.claude ~/.claude-corrupted-$(date +%Y%m%d)

# 2. Restaurar do ZIP mais recente
cd ~/Desktop
unzip ecossistema-vX.X.X-YYYYMMDD.zip -d ~/.claude

# 3. Verificar restauração
ls ~/.claude/
```

### Cenário 3: Perdi tudo (falha de hardware)
```bash
# 1. Baixar ZIP do cloud storage
# 2. Extrair em nova máquina
unzip ecossistema-vX.X.X.zip -d ~/.claude

# 3. Clonar repositório de ofertas
git clone [url-do-repo] ~/copywriting-ecosystem

# 4. Verificar integridade
cd ~/copywriting-ecosystem && claude
# Rodar /checkup
```

---

## Checklist Pré-Upgrade

Antes de qualquer upgrade significativo do ecossistema:

### Obrigatório
- [ ] `git status` limpo (sem mudanças não commitadas)
- [ ] Último commit < 24h
- [ ] ZIP atual no Desktop (< 7 dias)

### Recomendado
- [ ] Backup no cloud atualizado
- [ ] Testar restauração do ZIP
- [ ] Documentar versão atual

### Comando de Verificação
```bash
echo "=== PRÉ-UPGRADE CHECK ===" && \
echo "Git status:" && git status --short && \
echo "" && \
echo "Último commit:" && git log -1 --oneline && \
echo "" && \
echo "ZIPs disponíveis:" && ls -la ~/Desktop/ecossistema-v*.zip 2>/dev/null || echo "Nenhum ZIP encontrado"
```

---

## Comandos Úteis

### Backup Rápido
```bash
# Git + tag
cd ~/copywriting-ecosystem
git add . && git commit -m "backup: $(date +%Y-%m-%d)" && git tag "backup-$(date +%Y%m%d)"
```

### Verificar Integridade
```bash
# Verificar estrutura do ecossistema
ls -la ~/.claude/skills/ | head -5
ls -la ~/.claude/hooks/*.ts | wc -l
cat ~/.claude/.version
```

### Comparar com Backup
```bash
# Listar diferenças entre atual e ZIP
diff -rq ~/.claude /tmp/backup-test/ 2>/dev/null | head -20
```

---

## Frequência Recomendada

| Ação | Frequência | Responsável |
|------|------------|-------------|
| Git commit | Após cada sessão | Manual |
| Session state | Automático | Sistema |
| ZIP export | Semanal (segunda) | Manual |
| Cloud upload | Mensal (dia 1) | Manual |
| Testar restore | Trimestral | Manual |

---

## Alertas e Lembretes

### Sinais de que Backup está Desatualizado
- [ ] Último commit > 7 dias
- [ ] Nenhum ZIP no Desktop
- [ ] Último upload cloud > 60 dias

### Ação Imediata
Se qualquer sinal acima for verdadeiro:
```bash
# 1. Commit imediato
git add . && git commit -m "backup: urgente"

# 2. Gerar ZIP
/update-ecosystem

# 3. Upload para cloud (manual)
```

---

## Referências

- `~/.claude/RUNBOOK.md` - Troubleshooting geral
- `~/.claude/GUIA-USO-ECOSSISTEMA.md` - Regras de higiene
- `~/copywriting-ecosystem/scripts/diagnose.sh` - Diagnóstico

---

*Estratégia estabelecida em: 2026-01-26*
*Próxima revisão: 2026-04-26*
