---
template_name: "voc-squad-consolidation"
template_version: "1.0.0"
template_type: "research"
description: "Template para consolidacao de resultados do VOC Squad (5 analistas paralelos)"
phase: "research"
deliverable_type: "voc-extraction"
output_format: "markdown"
---

# VOC Squad Consolidation Template

> **Propósito:** Consolidar resultados dos 5 analistas do VOC Squad
> **Input:** Outputs dos 5 analistas (YouTube, Instagram, TikTok, Reddit, Amazon)
> **Output:** VOC consolidado com triangulação cross-platform
> **Sprint:** AIOS Upgrade Plan v4.0 § S6.9

---

## Metadata

```yaml
offer: "{offer_name}"
niche: "{niche}"
consolidation_date: "{date}"
analysts_reporting:
  - youtube: {quotes_count}
  - instagram: {quotes_count}
  - tiktok: {quotes_count}
  - reddit: {quotes_count}
  - amazon: {quotes_count}
total_quotes: {sum}
triangulation_rate: "{percentage}%"
```

---

## 1. Por Plataforma (Sumário)

### YouTube

**Quotes Extraídos:** {count}
**DRE Médio:** {1-5}
**Padrão Linguístico Dominante:** {descrição}

Top 3 Quotes:
1. "{quote}" — {engagement}, DRE {level}
2. "{quote}" — {engagement}, DRE {level}
3. "{quote}" — {engagement}, DRE {level}

Insight Principal: {insight}

---

### Instagram

**Quotes Extraídos:** {count}
**DRE Médio:** {1-5}
**Padrão Linguístico Dominante:** {descrição}

Top 3 Quotes:
1. "{quote}" — {engagement}, DRE {level}
2. "{quote}" — {engagement}, DRE {level}
3. "{quote}" — {engagement}, DRE {level}

Insight Principal: {insight}

---

### TikTok

**Quotes Extraídos:** {count}
**DRE Médio:** {1-5}
**Padrão Linguístico Dominante:** {descrição}

Top 3 Quotes:
1. "{quote}" — {engagement}, DRE {level}
2. "{quote}" — {engagement}, DRE {level}
3. "{quote}" — {engagement}, DRE {level}

Insight Principal: {insight}

---

### Reddit

**Quotes Extraídos:** {count}
**DRE Médio:** {1-5}
**Padrão Linguístico Dominante:** {descrição}

Top 3 Quotes:
1. "{quote}" — {engagement}, DRE {level}
2. "{quote}" — {engagement}, DRE {level}
3. "{quote}" — {engagement}, DRE {level}

Insight Principal: {insight}

---

### Amazon/Reviews

**Quotes Extraídos:** {count}
**DRE Médio:** {1-5}
**Padrão Linguístico Dominante:** {descrição}

Top 3 Quotes:
1. "{quote}" — {engagement}, DRE {level}
2. "{quote}" — {engagement}, DRE {level}
3. "{quote}" — {engagement}, DRE {level}

Insight Principal: {insight}

---

## 2. Triangulação Cross-Platform

> **Triangulação:** Padrões que aparecem em 3+ plataformas são validados como universais.

### Dores Trianguladas (3+ plataformas)

| Dor | YouTube | Instagram | TikTok | Reddit | Amazon | DRE Médio |
|-----|---------|-----------|--------|--------|--------|-----------|
| {dor_1} | ✅ | ✅ | ✅ | ✅ | ✅ | {level} |
| {dor_2} | ✅ | ✅ | ✅ | ❌ | ✅ | {level} |
| {dor_3} | ✅ | ❌ | ✅ | ✅ | ✅ | {level} |

### Desejos Triangulados (3+ plataformas)

| Desejo | YouTube | Instagram | TikTok | Reddit | Amazon | DRE Médio |
|--------|---------|-----------|--------|--------|--------|-----------|
| {desejo_1} | ✅ | ✅ | ✅ | ✅ | ✅ | {level} |
| {desejo_2} | ✅ | ✅ | ✅ | ❌ | ❌ | {level} |

### Objeções Trianguladas

| Objeção | Plataformas | Frequência | Tipo |
|---------|-------------|------------|------|
| {objecao_1} | YT, IG, Reddit | Alta | Preço |
| {objecao_2} | TT, Reddit, Amazon | Média | Eficácia |

---

## 3. Padrões Linguísticos Consolidados

### Universais (todas plataformas)

| Padrão | Exemplo | Uso Recomendado |
|--------|---------|-----------------|
| {padrão_1} | "{exemplo}" | Lead, Hook |
| {padrão_2} | "{exemplo}" | Problema, Agitação |

### Plataforma-Específicos

| Plataforma | Padrão Único | Exemplo | Nota |
|------------|--------------|---------|------|
| YouTube | {padrão} | "{exemplo}" | Tom confessional |
| TikTok | {padrão} | "{exemplo}" | Ultra-curto, gírias |
| Reddit | {padrão} | "{exemplo}" | Cru, sem filtro |

### Vocabulário VOC Consolidado

```markdown
## Palavras de DOR (usar em copy)
- "{palavra_1}"
- "{palavra_2}"
- "{palavra_3}"

## Palavras de DESEJO (usar em copy)
- "{palavra_1}"
- "{palavra_2}"
- "{palavra_3}"

## Expressões de FRUSTRAÇÃO
- "{expressão_1}"
- "{expressão_2}"

## Expressões de ESPERANÇA
- "{expressão_1}"
- "{expressão_2}"
```

---

## 4. DRE por Plataforma

| Plataforma | DRE Mínimo | DRE Máximo | DRE Médio | Pico Emocional |
|------------|------------|------------|-----------|----------------|
| YouTube | {min} | {max} | {avg} | {descrição} |
| Instagram | {min} | {max} | {avg} | {descrição} |
| TikTok | {min} | {max} | {avg} | {descrição} |
| Reddit | {min} | {max} | {avg} | {descrição} |
| Amazon | {min} | {max} | {avg} | {descrição} |
| **CONSOLIDADO** | {min} | {max} | {avg} | {descrição} |

---

## 5. Recomendações de Formato

> Baseado nos padrões observados, recomendações para produção de copy:

### Hook/Lead

**Tom recomendado:** {tom baseado em padrões}
**Linguagem:** {formal/informal/ultra-casual}
**Comprimento:** {curto/médio/longo}

Quotes para inspiração:
1. "{quote mais impactante para hook}"
2. "{quote alternativo}"

### Problema/Agitação

**DRE alvo:** {level baseado em DRE médio}
**Emoções a ativar:** {lista de emoções dominantes}

Quotes para usar literalmente:
1. "{quote de dor mais intensa}"
2. "{quote de frustração}"
3. "{quote de desespero}"

### Solução/Transformação

**Linguagem de desejo:** {padrões de 5 estrelas}
**Prova social:** {tipo de prova mais presente}

Quotes para inspiração:
1. "{quote de transformação}"
2. "{quote de satisfação}"

---

## 6. Gaps e Limitações

### Plataformas com Dados Insuficientes

| Plataforma | Quotes | Status | Ação Recomendada |
|------------|--------|--------|------------------|
| {plataforma} | {count} | ⚠️ Insuficiente | Re-executar com keywords diferentes |

### Triangulação Incompleta

| Insight | Plataformas | Gap |
|---------|-------------|-----|
| {insight} | YT, IG | Falta TikTok, Reddit, Amazon |

### Próximos Passos

- [ ] {ação_1}
- [ ] {ação_2}
- [ ] {ação_3}

---

## 7. Métricas de Qualidade

| Métrica | Valor | Status |
|---------|-------|--------|
| Plataformas com dados | {X}/5 | {✅ ou ⚠️} |
| Quotes totais | {count} | {✅ >= 80 ou ⚠️ < 80} |
| Taxa de triangulação | {%} | {✅ >= 30% ou ⚠️ < 30%} |
| DRE médio consolidado | {level} | {✅ >= 3 ou ⚠️ < 3} |
| Padrões identificados | {count} | {✅ >= 10 ou ⚠️ < 10} |

---

*VOC Squad Consolidation — Template v1.0*
*AIOS Upgrade Plan v4.0 § S6.9*
*Criado: 2026-02-27*
