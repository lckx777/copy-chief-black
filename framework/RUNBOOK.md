# RUNBOOK - Copywriting Ecosystem v4.9

Guia prático de operações, troubleshooting e verificações do ecossistema.

---

## Índice

1. [Ecosystem Hygiene](#1-ecosystem-hygiene)
2. [Health Check](#2-health-check)
3. [Verificação de MCPs](#3-verificação-de-mcps)
4. [Troubleshooting Comum](#4-troubleshooting-comum)
5. [Setup de Novo Projeto](#5-setup-de-novo-projeto)
6. [Workarounds Documentados](#6-workarounds-documentados)
7. [Comandos de Referência](#7-comandos-de-referência)
8. [Limitações do Claude Code](#8-limitações-do-claude-code)

---

## 1. Ecosystem Hygiene ⚠️ CRÍTICO

### 1.1 Como Abrir o Claude Code

```bash
# ✅ CORRETO - Sempre usar:
cd ~/copywriting-ecosystem && claude

# ❌ INCORRETO - Nunca usar:
cd ~/copywriting-ecosystem/concursos/hacker && claude
cd ~ && claude
```

**Por quê?** Claude Code carrega CLAUDE.md do diretório atual. Locais diferentes = contexto diferente = bagunça.

### 1.2 Nunca Extrair ZIP Dentro do Ecossistema

```bash
# ✅ CORRETO
cd ~/Desktop && unzip ecossistema-vXX-installer.zip

# ❌ INCORRETO (cria duplicados aninhados)
cd ~/copywriting-ecosystem && unzip *.zip
```

### 1.3 Verificação de Duplicados

```bash
# Deve retornar VAZIO
find ~/copywriting-ecosystem -name "copywriting-ecosystem" -type d | grep -v "^/Users/.*/copywriting-ecosystem$"

# Se retornar algo, deletar:
rm -rf [caminho_retornado]
```

### 1.4 Checklist Semanal de Higiene

- [ ] `find ~/copywriting-ecosystem -name "copywriting-ecosystem" -type d` (deve retornar apenas raiz)
- [ ] `find ~/copywriting-ecosystem -type d -name "clients"` (deve retornar vazio)
- [ ] `ls ~/Desktop/ecossistema-v*.zip` (deve mostrar apenas 1 arquivo)
- [ ] `git add . && git commit` no ecossistema
- [ ] Atualizar task_plan.md com status real

---

## 2. Health Check

### 2.1 Verificação Rápida (30 segundos)

```bash
# MCPs conectados
claude mcp list

# Plugins ativos
claude plugin list

# Skills disponíveis
ls ~/.claude/skills/

# Commands disponíveis
ls ~/.claude/commands/
```

### 2.2 Checklist de Componentes

| Componente | Verificar | Esperado |
|------------|-----------|----------|
| claude-mem | `claude plugin list` | Ativo |
| planning-with-files | `claude plugin list` | Ativo |
| github | `claude plugin list` | Ativo |
| apify | `claude mcp list` | Conectado |
| firecrawl | `claude mcp list` | Conectado |
| playwright | `claude mcp list` | Conectado |
| zen | `claude mcp list` | Conectado |
| fb_ad_library | `claude mcp list` | Conectado |

### 2.3 Teste de MCP Funcional

```
# No Claude Code, testar acesso
"Teste rápido: use mcp__firecrawl__firecrawl_scrape para extrair título de https://httpbin.org"
```

Resultado esperado: Título da página retornado

---

## 3. Verificação de MCPs

### 3.1 Configuração de MCPs

**Localização:** `~/.claude.json` (seção `mcpServers`)

```json
{
  "mcpServers": {
    "apify": { "type": "stdio", "command": "npx", "args": ["-y", "@anthropic-ai/apify-mcp"] },
    "firecrawl": { "type": "stdio", "command": "npx", "args": ["-y", "firecrawl-mcp"] },
    "playwright": { "type": "stdio", "command": "npx", "args": ["@playwright/mcp@latest"] },
    "zen": { "type": "stdio", "command": "~/.zen-mcp-server/venv/bin/python", "args": ["~/.zen-mcp-server/server.py"] },
    "fb_ad_library": { ... }
  }
}
```

### 3.2 MCP Access em Subagents

**CRÍTICO:** Custom subagent_types NÃO herdam MCPs!

| Subagent Type | MCP Access | Ferramentas |
|---------------|------------|-------------|
| `general-purpose` | ✅ SIM | Todas (incluindo MCPs) |
| `researcher` (custom) | ❌ NÃO | Apenas Read, Write, WebSearch |
| `copywriter` (custom) | ❌ NÃO | Apenas Read, Write |
| `reviewer` (custom) | ❌ NÃO | Apenas Read, Write |

**Solução:** Usar `subagent_type: general-purpose` para tarefas que precisam de MCPs.

---

## 4. Troubleshooting Comum

### 4.1 Contexto Errado / Instruções Diferentes

**Sintoma:** Claude não segue as regras do ecossistema

**Causa:** Abriu Claude Code de diretório errado

**Solução:**
```bash
# Fechar Claude Code e reabrir corretamente
cd ~/copywriting-ecosystem && claude
```

### 4.2 Diretórios Duplicados Aparecendo

**Sintoma:** Estrutura `copywriting-ecosystem/copywriting-ecosystem/` aparece

**Causa:** Extraiu ZIP dentro do ecossistema

**Solução:**
```bash
find ~/copywriting-ecosystem -name "copywriting-ecosystem" -type d | grep -v "^/Users/.*/copywriting-ecosystem$" | xargs rm -rf
```

### 4.3 Subagent Não Tem Acesso a MCPs

**Sintoma:** Agent diz "não tenho acesso ao Playwright/Apify/Firecrawl"

**Causa:** Usando custom subagent_type (researcher, copywriter, etc.)

**Solução:**
```yaml
# Errado
subagent_type: researcher

# Correto
subagent_type: general-purpose
```

### 4.4 VOC Retorna Blogs ao Invés de Comentários

**Sintoma:** Pesquisa retorna conteúdo de blogs educacionais

**Causa:** WebSearch usado ao invés de Apify

**Solução:**
1. Verificar se está usando `general-purpose` como subagent_type
2. Instruir explicitamente: "Use mcp__apify, NÃO use WebSearch"
3. Seguir VOC Quality Protocol (Apify → Playwright → Firecrawl → WebSearch)

### 4.5 Context Overflow

**Sintoma:** Respostas lentas, qualidade degradando

**Solução imediata:**
```
/compact preserve: offer brief, HELIX decisions, current phase
```

**Solução estrutural:**
1. Usar tiered output (raw → processed → summary)
2. NUNCA carregar raw/ direto
3. SEMPRE começar por summary.md

### 4.6 MCP Não Conecta

**Sintoma:** `claude mcp list` mostra MCP como desconectado

**Verificações:**
1. API Key válida? Verificar em `~/.claude.json`
2. npx instalado? `which npx`
3. Dependências? Rodar manualmente: `npx -y @anthropic-ai/apify-mcp`

**Logs:**
```bash
claude mcp logs apify
```

---

## 5. Setup de Novo Projeto

### 5.1 Estrutura v4.9 (Niche-First)

```
~/copywriting-ecosystem/{nicho}/{oferta}/
```

**Exemplos:**
- `concursos/gabaritando-lei-seca/`
- `concursos/hacker/`
- `saude/oferta-nome/`

### 5.2 Criar Nova Oferta

```
# No Claude Code, dentro do ecossistema
/create-offer [nicho] [oferta]
```

**Exemplo:**
```
/create-offer concursos nova-oferta
```

### 5.3 Estrutura Criada

```
~/copywriting-ecosystem/{nicho}/{oferta}/
├── CLAUDE.md
├── task_plan.md
├── findings.md
├── progress.md
├── research/
│   ├── voc/
│   ├── competitors/
│   ├── mechanism/
│   └── avatar/
├── briefings/
│   ├── phases/
│   └── validations/
└── production/
    ├── vsl/
    ├── landing-page/
    ├── creatives/
    └── emails/
```

### 5.4 Checklist Pré-Execução

- [ ] Estrutura de pastas criada
- [ ] task_plan.md inicializado
- [ ] CLAUDE.md com contexto da oferta
- [ ] Briefing/contexto do produto disponível
- [ ] MCPs verificados (`claude mcp list`)

---

## 6. Workarounds Documentados

### 6.1 VOC Extraction com MCPs

```python
Task(
    description="VOC extraction",
    prompt="""
    Você é um specialist em VOC extraction para copywriting.

    FERRAMENTAS DISPONÍVEIS:
    - mcp__apify (YouTube, Instagram, TikTok comments)
    - mcp__firecrawl (landing pages, reviews)
    - mcp__playwright (Meta Ads Library, sites com login)

    SEGUIR VOC Quality Protocol:
    1. Apify Actor específico primeiro
    2. Playwright se Apify falha
    3. Firecrawl se Playwright falha
    4. WebSearch APENAS como último resort

    OUTPUT: research/{offer}/voc/
    """,
    subagent_type="general-purpose"  # CRÍTICO
)
```

### 6.2 Paralelização Real

**Opção A:** `/squad-research` (tmux + git worktrees)
- 4 sessões paralelas reais
- Cada uma com contexto isolado de 200k
- Requer tmux instalado

**Opção B:** `/helix-parallel` (sequencial com fan-out)
- Mais simples, sem dependências
- Executa módulos um por um

---

## 7. Comandos de Referência

### 7.1 Diagnóstico

```bash
# Status completo
claude mcp list && claude plugin list

# Logs de MCP específico
claude mcp logs apify

# Ver configuração
cat ~/.claude.json | jq '.mcpServers'

# Verificar duplicados
find ~/copywriting-ecosystem -name "copywriting-ecosystem" -type d
```

### 7.2 Execução de Workflow

```bash
# Research
/helix-parallel [oferta]
/squad-research [oferta]

# Produção
/produce-offer [oferta]

# Review
/review-all [oferta]

# Criar nova oferta
/create-offer [nicho] [oferta]

# Atualizar installer
/update-ecosystem
```

### 7.3 Manutenção

```bash
# Comprimir contexto
/compact

# Ver uso de tokens
/context

# Reiniciar MCP
claude mcp restart [nome]
```

---

## 8. Limitações do Claude Code

**IMPORTANTE:** O ecossistema é **DOCUMENTATION-DRIVEN**, não **AUTOMATION-DRIVEN**.

| O que PARECE | O que É |
|--------------|---------|
| Skills ativam por trigger | Documentação para Claude seguir |
| Gates bloqueiam | Checkpoints manuais |
| Ofertas sync | Atualização manual |
| VOC protocol enforced | Instrução em prompt |
| Subagents herdam MCPs | Apenas general-purpose |

**Princípio:** Tratar o ecossistema como **guia de operações**, não como **sistema automatizado**.

---

## 9. Referência Rápida de Erros

| Erro | Causa Provável | Solução |
|------|----------------|---------|
| Contexto errado | Abriu de diretório errado | `cd ~/copywriting-ecosystem && claude` |
| Duplicados aparecem | Extraiu ZIP dentro | Deletar com find + rm |
| "não tenho acesso ao MCP" | Custom subagent_type | Usar general-purpose |
| "Apify rate limit" | Muitas requests | Esperar ou usar proxy |
| "Firecrawl timeout" | Site muito grande | Reduzir scope |
| "Context overflow" | Muito dado carregado | /compact ou tiered output |

---

*Última atualização: 2026-01-21 | v4.9*
