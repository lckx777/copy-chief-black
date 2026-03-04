---
template_name: "extended-thinking-protocol"
template_version: "1.0.0"
template_type: "methodology"
description: "Protocolo para uso de Extended Thinking em decisoes complexas do pipeline"
phase: "any"
output_format: "markdown"
---

# Extended Thinking Protocol (v6.4)

> Fonte: Pesquisa Externa 01.md - Extended Thinking State of the Art 2026
> Descoberta: -36% performance criativa com ET ligado; +análise com ET ligado
> **v6.4:** Adaptado para Subscription Max 20x (não API)

---

## 🔧 Contexto de Uso

**Este protocolo é para Claude Max 20x Subscription, NÃO para API.**

| Ambiente | Como Ativar ET | Como Desativar |
|----------|----------------|----------------|
| **Claude Code CLI** | `Option+T` (Mac) / `Alt+T` (Win) | `Option+T` novamente |
| **Claude.ai Web** | Toggle na interface | Toggle novamente |

---

## Princípio Bifásico

**Extended Thinking prejudica criatividade mas melhora análise.**

| Modo | Extended Thinking | Uso |
|------|-------------------|-----|
| ANÁLISE | **ON** (Option+T) | Síntese, avaliação, decisão |
| CRIAÇÃO | **OFF** | Ideação, naming, copy |

---

## Por Fase HELIX

| Fase | Tipo | ET | Como Ativar | Justificativa |
|------|------|-----|-------------|---------------|
| 1 (Identificação) | Análise | **ON** | Option+T | Organizar inputs |
| 2 (Pesquisa) | Análise | **ON** | Option+T | Síntese de competitors |
| 3 (Avatar) | Análise | **ON** | Option+T | Psicologia profunda |
| 4 (Consciência) | Análise | **ON** | Option+T | Mapeamento |
| 5A (MUP Divergente) | Criação | **OFF** | Desativar | Gerar 15+ ideias |
| 5B (MUP Convergente) | Análise | **ON** | Option+T | Avaliar candidatos |
| 6A (MUS Divergente) | Criação | **OFF** | Desativar | Gerar 12+ MUSs |
| 6B (MUS Convergente) | Análise | **ON** | Option+T | Selecionar pares |
| 7-10 (Produção) | Criação | **OFF** | Desativar | Escrever copy |

---

## Como Ativar Extended Thinking (Subscription)

### CLI (Claude Code)

```
1. Antes de enviar prompt: Option+T (Mac) ou Alt+T (Win)
2. Ícone de "pensamento" aparece
3. Enviar prompt normalmente
4. Claude pensa antes de responder (~31,999 tokens default)
5. Para desativar: Option+T novamente
```

### Web (Claude.ai)

```
1. Localizar toggle de Extended Thinking na interface
2. Ativar antes de enviar mensagem
3. Claude pensa antes de responder
4. Desativar quando não precisar mais
```

---

## Workflow Bifásico Exemplificado

### Fase 5 (MUP) - Bifásica

```
ETAPA 1: DIVERGENTE (ET OFF)
────────────────────────────
[Desativar ET com Option+T]

"Gere 15 mecanismos do problema completamente diferentes.
PROIBIDO: avaliar, filtrar, julgar.
Apenas GERAR."

↓ Output: 15+ MUPs candidatos

ETAPA 2: CONVERGENTE (ET ON)
────────────────────────────
[Ativar ET com Option+T]

"Avalie os 15 MUPs usando estes critérios:
- Novelty (25%)
- Credibility (25%)
- Emotional (20%)
- Defensibility (15%)
- Differentiation (15%)

Selecione TOP 3 com scores e justificativas."

↓ Output: 3 MUPs finais rankeados
```

---

## Referência de Thinking (Subscription)

> **Nota:** Em subscription, o budget é automático (~31,999 tokens no CLI).
> O princípio de "retornos decrescentes" ainda se aplica conceitualmente.

| Complexidade | Recomendação |
|--------------|--------------|
| Raciocínio simples | ET OFF (desnecessário) |
| Média complexidade | ET ON |
| Análise complexa | ET ON (padrão HELIX) |
| Produção criativa | ET OFF (prejudica) |

---

## Anti-Patterns

| Anti-Pattern | Problema | Solução |
|--------------|----------|---------|
| ET ON para ideação | Outputs previsíveis | Option+T para desligar |
| ET OFF para avaliação | Análise superficial | Option+T para ligar |
| ET sempre ON | Criatividade prejudicada | Alternar por fase |

---

## Implementação no Ecossistema

### Em Skills

```
[Para fases analíticas]
→ Instruir usuário: "Ative Extended Thinking (Option+T) antes de continuar"

[Para fases criativas]
→ Instruir usuário: "Desative Extended Thinking se estiver ativo"
```

### Em Prompts de Produção

```
# PRODUÇÃO CRIATIVA - Extended Thinking DESATIVADO
# Objetivo: maximizar novidade e surpresa
# [Certifique-se que Option+T está OFF]

[prompt de produção...]
```

```
# ANÁLISE ESTRATÉGICA - Extended Thinking ATIVADO
# [Ative com Option+T antes de enviar]

[prompt de análise...]
```

---

## Checklist de Aplicação

Antes de executar tarefa:
- [ ] Identificar tipo: ANÁLISE ou CRIAÇÃO
- [ ] Se ANÁLISE: ativar ET com Option+T
- [ ] Se CRIAÇÃO: desativar ET com Option+T
- [ ] Verificar ícone de "pensamento" no CLI

---

*v6.4 - Adaptado para Subscription Max 20x*
*Atualizado: 2026-01-31*
