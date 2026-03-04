---
template_name: "mup-mus-discovery"
template_version: "1.0.0"
template_type: "methodology"
description: "Framework de discovery para Mecanismo Unico do Problema e da Solucao"
phase: "briefing"
output_format: "markdown"
---

# Template: MUP/MUS Discovery (CreativeDC)

> Workflow 6-step baseado em pesquisa Divergent-Convergent (63.5% novelty increase)
> Fonte: Pesquisa Externa 02.md - CreativeDC Framework

---

## FASE 1: Divergente - Geração de MUPs

**Prompt:**
```
Gere 15 mecanismos únicos explicando por que [PROBLEMA] acontece.

Categorize em:
- Científicos (5): mecanismos biológicos, fisiológicos, neurológicos
- Psicológicos (5): crenças, comportamentos, padrões mentais
- Externos (5): ambiente, sociedade, indústria, sistema

REGRAS:
- Cada mecanismo deve ser DIFERENTE em natureza, não variações do mesmo
- PROIBIDO: [listar 5 clichês conhecidos do nicho]
- Use linguagem proprietária (nomeie cada mecanismo)

Formato:
1. [Nome do Mecanismo]: [Descrição em 1-2 frases]
```

**Output esperado:** 15 MUPs candidatos organizados por categoria

---

## FASE 2: Checagem de Diversidade

**Prompt:**
```
Analise os 15 mecanismos gerados.

Identifique:
1. Quais ângulos NÃO foram explorados?
2. Há clustering/similaridade entre mecanismos?
3. Quais categorias estão subrepresentadas?

Gere 5 mecanismos adicionais que explorem esses GAPS específicos.
```

**Output esperado:** 5 MUPs adicionais cobrindo ângulos não explorados

---

## FASE 3: Convergente - Avaliação de MUPs

**Critérios de Avaliação (1-10):**

| Critério | Pergunta | Peso |
|----------|----------|------|
| **Novelty** | Quão diferente dos concorrentes? | 25% |
| **Credibility** | Sustentável com evidência? | 25% |
| **Emotional Connection** | Ressoa com dor do avatar? | 20% |
| **Defensibility** | Difícil de copiar? | 15% |
| **Differentiation** | Único no mercado? | 15% |

**Prompt:**
```
Avalie cada um dos 20 MUPs usando os 5 critérios (1-10).

Calcule score ponderado:
Score = (Novelty × 0.25) + (Credibility × 0.25) + (Emotional × 0.20) + (Defensibility × 0.15) + (Differentiation × 0.15)

Ordene do maior para menor score.
Selecione TOP 3 para próxima fase.
```

**Output esperado:** TOP 3 MUPs com scores e justificativas

---

## FASE 4: Divergente - Geração de MUSs

**Para CADA TOP 3 MUP, executar:**

**Prompt:**
```
Para o MUP "[NOME DO MUP]":

Gere 12 mecanismos de SOLUÇÃO únicos.

Categorize em:
- Comportamentais (4): hábitos, rotinas, práticas diárias
- Ingredientes/Componentes (4): substâncias, elementos, ferramentas
- Processos/Sistemas (4): metodologias, frameworks, sequências

REGRAS:
- Cada MUS deve ser PROPRIETÁRIO e NOMEÁVEL
- Deve conectar diretamente com o MUP (se MUP = causa, MUS = solução)
- PROIBIDO: soluções genéricas como "dieta e exercício"

Formato:
1. [Nome do MUS]: [Descrição] → Conecta com MUP porque [razão]
```

**Output esperado:** 36 MUSs (12 por MUP) organizados por categoria

---

## FASE 5: Convergente - Seleção de MUS

**Critérios adicionais para MUS:**

| Critério | Pergunta |
|----------|----------|
| **Conexão MUP** | A solução resolve diretamente o problema identificado? |
| **Simplicidade** | O avatar consegue entender em 10 segundos? |
| **Ação Clara** | O que o avatar precisa FAZER é óbvio? |
| **Proof Path** | Existe evidência disponível para sustentar? |

**Prompt:**
```
Para cada TOP 3 MUP, selecione o MELHOR MUS usando os critérios.

Justifique a seleção com:
- Por que este MUS e não os outros?
- Qual evidência pode sustentar?
- Qual objeção mais forte e como responder?
```

**Output esperado:** 3 pares MUP-MUS finais com justificativas

---

## FASE 6: Convergência Final

**Para cada par MUP-MUS vencedor:**

**Prompt:**
```
Para o par [MUP] + [MUS]:

1. EVIDÊNCIAS (3):
   - Cite 3 fontes que sustentam este mecanismo
   - Prefira estudos, dados, cases reais

2. OBJEÇÕES (5):
   - Liste 5 objeções potenciais do cético
   - Para cada, forneça resposta de 1 frase

3. HEADLINES (10):
   - Gere 10 variações de headline usando este MUP-MUS
   - Varie: curiosidade, medo, promessa, prova social, novidade
```

**Output esperado:** Pacote completo para briefing HELIX

---

## CHECKLIST DE DIVERSIDADE

**Sinais de Divergência FALHANDO:**
- [ ] Fraseado similar entre mecanismos
- [ ] Output genérico, poderia ser qualquer nicho
- [ ] Sem surpresas ou ângulos inesperados
- [ ] Clustering em torno de 2-3 ideias

**Sinais de Convergência FALHANDO:**
- [ ] Selecionando "mais seguro" vs "mais diferenciado"
- [ ] Ideias indefensáveis com evidência
- [ ] Ignorando constraints de mercado
- [ ] Critérios vagos ("esse parece melhor")

---

## ANTI-PADRÕES

| Anti-Padrão | Problema | Solução |
|-------------|----------|---------|
| **Artificial Hivemind** | Modelos convergem para outputs similares | Forçar categorias diferentes |
| **Temperature Myth** | Achar que temperature alta = diversidade | Estrutura > temperature |
| **Safe Selection** | Escolher o menos controverso | Usar critérios objetivos |
| **Cliché Creep** | MUPs genéricos do nicho | Lista de proibidos no prompt |

---

*Baseado em CreativeDC Framework (Dezembro 2025)*
*Pesquisa Externa 02.md - 63.5% novelty increase validado*
