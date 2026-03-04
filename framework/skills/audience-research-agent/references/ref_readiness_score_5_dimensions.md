# Score de Prontidão - Sistema de Avaliação

> **Usar para:** Determinar se a pesquisa está completa o suficiente para passar para o próximo agente
> **Regra:** Pesquisa só avança com score >= 70/100

---

## Visão Geral

O Score de Prontidão avalia 5 dimensões críticas para garantir que a pesquisa tem substância suficiente para gerar copy de alta conversão.

```
┌─────────────────────────────────────────────────────────────┐
│                    SCORE DE PRONTIDÃO                       │
├─────────────────────────────────────────────────────────────┤
│  Cobertura de Fontes ............ [__/20]                  │
│  Profundidade de Dores .......... [__/25]                  │
│  Clareza de Desejos ............. [__/20]                  │
│  Mapeamento de Objeções ......... [__/20]                  │
│  Qualidade da Linguagem ......... [__/15]                  │
├─────────────────────────────────────────────────────────────┤
│  TOTAL .......................... [__/100]                 │
│                                                             │
│  STATUS: [Insuficiente | Parcial | Pronto]        │
└─────────────────────────────────────────────────────────────┘
```

---

## Dimensão 1: Cobertura de Fontes (máx 20 pontos)

Avalia diversidade e quantidade de fontes consultadas.

| Critério | Pontos |
|----------|--------|
| 1-2 plataformas consultadas | 5 |
| 3-4 plataformas consultadas | 10 |
| 5+ plataformas consultadas | 15 |
| Inclui Reclame Aqui (BR) | +3 |
| Inclui fonte de conteúdo orgânico (YT/IG/TT) | +2 |

**Máximo:** 20 pontos

**Exemplo de cálculo:**
- YouTube + Instagram + Reclame Aqui + Mercado Livre = 4 plataformas (10 pts)
- Inclui Reclame Aqui (+3 pts)
- Inclui YouTube (+2 pts)
- **Total dimensão:** 15/20

---

## Dimensão 2: Profundidade de Dores (máx 25 pontos)

Avalia se as dores mapeadas vão além do superficial.

| Critério | Pontos |
|----------|--------|
| Dores superficiais identificadas (mín 5) | 5 |
| Dores intermediárias identificadas (mín 3) | 7 |
| Dores viscerais identificadas (mín 2) | 10 |
| Pelo menos 1 dor com intensidade 5 | +3 |

**Checklist de Dor Visceral (precisa ter pelo menos 2):**
- [ ] O que os mantém acordados às 3 da manhã?
- [ ] Que problema têm VERGONHA de admitir?
- [ ] Como afeta seus relacionamentos?
- [ ] O que secretamente CULPAM pelos fracassos?
- [ ] Qual narrativa negativa repetem para si mesmos?

**Máximo:** 25 pontos

---

## Dimensão 3: Clareza de Desejos (máx 20 pontos)

Avalia se os desejos estão bem mapeados nos 3 níveis.

| Critério | Pontos |
|----------|--------|
| Desejos declarados identificados (mín 3) | 5 |
| Desejos implícitos identificados (mín 2) | 7 |
| Desejos secretos identificados (mín 1) | 5 |
| Desejo conectado a gatilho reptiliano | +3 |

**Checklist de Desejo Secreto (precisa ter pelo menos 1):**
- [ ] O que querem mas têm MEDO de pedir?
- [ ] Como seria o "dia perfeito" após resolver?
- [ ] Que versão de si mesmos querem se tornar?
- [ ] Que status ou reconhecimento buscam secretamente?

**Máximo:** 20 pontos

---

## Dimensão 4: Mapeamento de Objeções (máx 20 pontos)

Avalia se as objeções estão identificadas e categorizadas.

| Critério | Pontos |
|----------|--------|
| Objeções de preço mapeadas | 4 |
| Objeções de tempo/esforço mapeadas | 4 |
| Objeções de ceticismo mapeadas | 6 |
| Objeções de adequação mapeadas | 4 |
| Pelo menos 1 objeção vinda do Reclame Aqui | +2 |

**Categorias de Objeção (precisa ter pelo menos 3 de 5):**
- [ ] Preço ("é caro", "não tenho dinheiro")
- [ ] Tempo ("não tenho tempo", "demora muito")
- [ ] Esforço ("parece difícil", "não vou conseguir")
- [ ] Ceticismo ("já tentei", "não funciona", "golpe")
- [ ] Adequação ("não é pra mim", "meu caso é diferente")

**Máximo:** 20 pontos

---

## Dimensão 5: Qualidade da Linguagem (máx 15 pontos)

Avalia se a linguagem capturada é utilizável em copy.

| Critério | Pontos |
|----------|--------|
| Mínimo 30 quotes verbatim | 5 |
| Quotes com alta carga emocional (intensidade 4-5) | 4 |
| Metáforas/analogias recorrentes identificadas | 3 |
| Linguagem validada em múltiplas fontes | 3 |

**Checklist de Linguagem:**
- [ ] Mínimo 30 quotes verbatim coletados
- [ ] Pelo menos 10 quotes com intensidade >= 4
- [ ] Pelo menos 3 metáforas/expressões recorrentes
- [ ] Pelo menos 50% dos quotes validados em 2+ fontes

**Máximo:** 15 pontos

---

## Tabela de Status

| Score | Status | Significado | Ação |
|-------|--------|-------------|------|
| 0-49 | Insuficiente | Pesquisa muito rasa | Voltar para revisão. Voltar à Fase 2. |
| 50-69 | Parcial | Pesquisa incompleta | Pode avançar com ressalvas. Listar gaps. |
| 70-84 | Pronto | Pesquisa adequada | Pode avançar para próximo agente. |
| 85-100 | Excelente | Pesquisa profunda | Avançar com confiança máxima. |

---

## Template de Output do Score

Incluir no final de TODA pesquisa:

```
═══════════════════════════════════════════════════════════════
                    SCORE DE PRONTIDÃO
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│  Cobertura de Fontes .................. [XX/20]            │
│    • Plataformas: [lista]                                  │
│    • Inclui RA: [sim/não]                                  │
│                                                             │
│  Profundidade de Dores ................ [XX/25]            │
│    • Superficiais: [X] | Intermediárias: [X] | Viscerais: [X] │
│    • Intensidade máxima: [X/5]                             │
│                                                             │
│  Clareza de Desejos ................... [XX/20]            │
│    • Declarados: [X] | Implícitos: [X] | Secretos: [X]     │
│                                                             │
│  Mapeamento de Objeções ............... [XX/20]            │
│    • Categorias cobertas: [X/5]                            │
│    • Objeções de ceticismo: [X]                            │
│                                                             │
│  Qualidade da Linguagem ............... [XX/15]            │
│    • Total quotes: [X]                                     │
│    • Quotes alta intensidade: [X]                          │
│    • Validação cruzada: [X%]                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TOTAL: [XX/100]                                           │
│                                                             │
│  STATUS: [Insuficiente | Parcial | Pronto]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

[Se status != PRONTO]
Atenção: GAPS IDENTIFICADOS:
• [gap 1]
• [gap 2]
• [gap 3]

RECOMENDAÇÃO: [ação sugerida]

[Se status == PRONTO]
[OK] PESQUISA APROVADA PARA PRÓXIMO AGENTE

Pontos fortes:
• [ponto forte 1]
• [ponto forte 2]

Áreas de atenção:
• [área que poderia ser melhorada se houver tempo]

═══════════════════════════════════════════════════════════════
```

---

## Regras de Decisão

### Condições para não avançar:
- Score < 50
- Zero dores viscerais identificadas
- Zero objeções de ceticismo mapeadas
- Menos de 20 quotes verbatim

### Avançar com ressalvas se:
- Score entre 50-69
- Falta cobertura em 1-2 dimensões
- **Recomendado:** Listar gaps específicos para o próximo agente

### Avançar com confiança se:
- Score >= 70
- Todas as dimensões com pelo menos 60% dos pontos
- Dores viscerais E objeções de ceticismo presentes

---

## Integração com Workflow

O Score de Prontidão é calculado automaticamente na **Fase 4** (Output RAG-Otimizado), antes de entregar o documento final.

```
Fase 1: Análise de Inputs
    ↓
Fase 2: Pesquisa Web Ativa
    ↓
Fase 3: Síntese Psicográfica
    ↓
Fase 4: Output RAG-Otimizado
    ↓
[CALCULAR SCORE DE PRONTIDÃO]
    ↓
Score >= 70? -> [OK] Entregar pesquisa
Score < 70?  -> Atenção: Listar gaps, perguntar se continua ou complementa
```
