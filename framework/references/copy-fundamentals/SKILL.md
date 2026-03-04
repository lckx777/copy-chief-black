---
name: copy-fundamentals
description: |
  Fundamentos universais de copy que devem ser lidos ANTES de produzir qualquer copy.
  Ativa automaticamente quando detecta triggers de producao de copy.
  Contem: psicologia da persuasao, estrutura de mecanismo, principios de escrita, erros fatais.
user-invocable: false
allowed-tools:
  - Read
---

# Copy Fundamentals - Fundamentos Universais

> **OBRIGATÓRIO:** Estes arquivos devem ser lidos ANTES de produzir qualquer copy.
> O sistema bloqueia produção de copy se estes arquivos não foram consultados.

## Arquivos de Referência (Leitura Obrigatória)

| Arquivo | Conteúdo |
|---------|----------|
| `references/psicologia-persuasao.md` | 16 Emoções, 4 Dominantes, Hierarquia de Dor, Vieses |
| `references/estrutura-mecanismo.md` | Puzzle Pieces 4 camadas, One Belief, Awareness, Sophistication |
| `references/principios-escrita.md` | Especificidade, Concisão, Fluidez, Frases de Poder, Hook 3 elementos |
| `references/erros-fatais.md` | 10 Erros Técnicos, Cícero (Essenciais vs Acidentais), Anti-Patterns |
| `references/disparos-dopamina.md` | 9 Tipos de Dopamine Triggers, Posicionamento Estratégico |
| `references/big-ideas.md` | 3 Elementos, Teste Unicidade, Fontes de Big Ideas |
| `references/revisao-universal.md` | 6 Checklists Pré-Entrega, Teste de Prolixidade |
| `references/pesquisa-estrategica.md` | VOC Discovery, Triangulação, 4 Dominantes |
| `references/glossario-copy.md` | Definições Técnicas, Distinções Críticas |
| `references/escrita-viva-principios.md` | Tensão, Transições Invisíveis, Ritmo |
| `references/antes-depois-tecnica.md` | 8 Casos de Transformação Mecânica → Viva |

## Quando Carregar

**SEMPRE antes de:**
- Produzir criativo/anuncio
- Escrever headline/hook
- Criar VSL/script
- Redigir landing page
- Desenvolver email de vendas
- Formular MUP/MUS
- Qualquer output de copy

## Workflow Obrigatorio

```
1. Detectar trigger de copy no prompt
2. LER arquivos de references/ relevantes
3. APLICAR princípios durante produção
4. VALIDAR output contra checklists
```

## Referencias Complementares (On-Demand)

Para frameworks especificos por tipo de copy, consultar:

| Tipo | Arquivo de Referencia |
|------|----------------------|
| Criativo DTC | `criativos-agent/references/frameworks/prsa-dtc.md` |
| Headlines | `criativos-agent/references/frameworks/frases-de-poder.md` |
| MUP/Vilao | `helix-system-agent/references/templates/briefing_fase05_problema_vilao_mup.md` |
| MUS/Mecanismo | `helix-system-agent/references/templates/briefing_fase06_solucao_mus.md` |
| VSL | `helix-system-agent/references/templates/briefing_fase10_progressao_emocional.md` |

## Integracao com Sistema

Esta skill trabalha em conjunto com:
- `pre-tool-use-gate.ts` - Bloqueia escrita de arquivos sem leitura
- `stop-copy-validation.ts` - Bloqueia resposta de copy sem leitura
- `user-prompt.ts` - Injeta reminder de arquivos obrigatorios

## Validacao

Antes de finalizar qualquer copy, verificar checklists em cada arquivo de referência:
- [ ] Checklist de references/psicologia-persuasao.md
- [ ] Checklist de references/estrutura-mecanismo.md
- [ ] Checklist de references/principios-escrita.md
- [ ] Checklist de references/erros-fatais.md
