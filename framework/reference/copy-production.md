---
phases: [PRODUCTION]
paths:
  - "production/**/*.md"
  - "**/production/**/*.md"
priority: HIGH
tokens: ~1200
---

# Copy Production Rules

> Regras específicas para contexto de produção de copy.
> Só carrega quando trabalhando em arquivos production/**/*.md

## GATE Validation Obrigatória

**ANTES de entregar qualquer copy:**

1. Incluir seção "GATE: Arquivos Lidos" com elementos ESPECÍFICOS
2. Documentar MUP/MUS usados e suas fontes
3. Listar arquivos de research consultados
4. Sugerir /copy-critic para validação final

## Formato de Entrega

```markdown
## Copy Entregue
[copy aqui]

## GATE: Arquivos Lidos
- Avatar: [elemento específico extraído]
- Sinestesia: [exemplo específico]
- Linguagem: [padrões identificados]

## Consistência
- MUP usado: [descrição] ← Fonte: [briefing/fase]
- MUS usado: [descrição] ← Fonte: [briefing/fase]

## Próximo Passo
Rodar /copy-critic para validação STAND
```

## Constraints

- NUNCA inventar MUP/MUS - extrair do research
- NUNCA produzir sem pre-flight check
- SEMPRE documentar fontes usadas

---

## Taxonomia Cyborg-Centaur (Pesquisa Externa 10.1 - Harvard/Wharton 2025)

> **Descoberta:** Modo de colaboração humano-IA define qualidade do output.

### Três Modos de Operação

| Modo | Descrição | % Profissionais | Resultado |
|------|-----------|-----------------|-----------|
| **Cyborg** | Co-criação fundida, diálogo iterativo constante | 60% | ✅ Ideal para copy |
| **Centauro** | Divisão clara humano/IA | 14% | ✅ Ideal para análise |
| **Self-Automator** | Prompts únicos, aceita output sem editar | 27% | ❌ ANTI-PADRÃO |

### Modelo "AI as Junior Employee"

- Você = Copy Chief (direção estratégica, julgamento final)
- IA = Analista Júnior (execução, variações, pesquisa)
- Se IA erra e você não percebe → responsabilidade é **sua**

### Regra 70/30 (OBRIGATÓRIO)

```
AI gera draft inicial ──────────────────── 70% do trabalho
                  ↓
Humano edita, adiciona voz, estratégia ─── 30% do trabalho
                  ↓
Output híbrido de alta qualidade
```

**Métricas validadas (WPP/Ahrefs 2025):**
- Híbrido: +26% CTR vs humano puro
- Híbrido: +40% qualidade vs IA pura
- Híbrido: 2.4x melhor SEO vs IA pura

### Self-Automator = Rejeição Automática

Se copy entregue tem sinais de Self-Automator:
- Aceitar output IA sem edição
- Elementos genéricos não-específicos
- Sem seção GATE demonstrando trabalho

→ **REJEITAR** e exigir retrabalho no modo Cyborg.

---

## Copy Thinker Mode (Pesquisa 4)

> **Princípio:** Separar ARQUITETURA (pensar) de EXECUÇÃO (escrever)

### Dois Modos de Operação

| Modo | Foco | Output |
|------|------|--------|
| **Thinker** | Estratégia, estrutura, direção | Briefing, plano, outline |
| **Writer** | Execução, copy, palavras | Copy final, entregáveis |

### Brief 2.0 Process

1. **Pre-Brief:** Carregar CONTEXT.md + synthesis.md
2. **Strategic Brief:** Definir ângulo, hook, estrutura ANTES de escrever
3. **Validation:** Confirmar alinhamento com MUP/MUS
4. **Execution:** Produzir copy seguindo o brief

**NUNCA** começar a escrever sem brief estratégico definido.

---

## HAI-CDP 4 Estágios (Pesquisa 10)

Human-AI Collaborative Design Process para copy:

| Estágio | Humano | IA |
|---------|--------|-----|
| **1. Explore** | Define problema, fornece contexto | Pesquisa, mapeia padrões |
| **2. Create** | Aprova direção estratégica | Gera variações, executa |
| **3. Evaluate** | Julga qualidade, decide | Fornece análise estruturada |
| **4. Iterate** | Feedback específico | Refina baseado no feedback |

### Divisão de Responsabilidades

**Humano decide:**
- Qual ângulo usar
- Se MUP/MUS estão corretos
- Se copy atinge objetivo
- Aprovar entrega final

**IA executa:**
- Pesquisa e síntese
- Geração de variações
- Aplicação de metodologias
- Documentação e consistência

---

## MCP como Enforcement de First Principles (v6.3)

> **Arquitetura:** MCP tools NÃO geram conhecimento. MCP tools VALIDAM se o conhecimento foi aplicado.

### Fluxo de Validação

```
CONHECIMENTO (First Principles)  →  PRODUÇÃO (Copy)  →  VALIDAÇÃO (MCP)
       ↑                                                      ↓
       └────────────────── FEEDBACK (se falhou) ─────────────┘
```

### Mapeamento First Principles (Fundamentos v5) → MCP Tools

| First Principle | Conceito v5 | MCP Tool | O que Valida |
|-----------------|-------------|----------|--------------|
| **6 Necessidades Humanas** | Sobrevivência, Prazer, Pertencimento, Status, Liberdade, Proteção | `voc_search emotion=` | VOC evidencia necessidade ativada |
| **DRE (Emoção Dominante Residente)** | Medo, Vergonha, Desejo, Raiva, Frustração — definida pelo briefing | `emotional_stress_test:visceral` | DRE ativada em nível 4-5 |
| **NUUPPECC 8 atributos** | Diagnóstico de hook (quais fazem sentido para ESTA oferta) | `blind_critic` | Atributos relevantes presentes |
| **Especificidade = Cena de Filme** | Dados precisos + Narrativa densa (cena vívida é MAIS poderosa) | `emotional_stress_test:genericidade` | ≥8/10 densidade narrativa |
| **Tom calibrado por oferta** | Espectro de tons definido pelo briefing, não tom fixo | `emotional_stress_test:genericidade` | Tom congruente com narrador |
| **MUP/MUS RMBC** | Mecanismo: [Órgão Real] + [Processo Inventado] + [Causa Externa] | `blind_critic copy_type=mechanism` | D+U+P validado |
| **Future Pacing** | Cenário positivo E negativo com timeframe específico + detalhes sensoriais | `emotional_stress_test:scroll_stop` | Visual/concreto |
| **Frases de Poder + Disparos de Dopamina** | Multiplicadores de força + mini-hooks distribuídos | `blind_critic` | Elementos de engajamento presentes |

### MCP Tools e Validacao

> Ref: tool-usage-matrix.md para matriz completa de ferramentas por fase e thresholds.

**Regras de Uso:**
1. **SEMPRE** carregar first principles ANTES de produzir
2. **SEMPRE** rodar MCP validation DEPOIS de produzir
3. **NUNCA** entregar copy sem score MCP >= 8/10
4. **SEMPRE** documentar scores no output

**Fluxo resumido:** `voc_search` (entrada) -> [produzir] -> `blind_critic` + `emotional_stress_test` (saida)

---

*v6.3 - Integração MCP + First Principles Enforcement*
*MCP Tools: validate_gate, voc_search, get_phase_context, blind_critic, emotional_stress_test, write_chapter, layered_review*
*Atualizado: 2026-01-30*
