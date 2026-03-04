---
template_name: "swipe-decomposition"
template_version: "1.0.0"
template_type: "research"
description: "Template para decomposicao estrutural de swipe files de referencia"
phase: "research"
deliverable_type: "other"
output_format: "markdown"
---

# Swipe Decomposition Template (v6.1)

> Fonte: Pesquisa Externa 05.md - Contextual Retrieval + Anti-Hivemind
> Princípio: Extrair PRINCÍPIOS, não copiar texto

---

## 14 Gatilhos Emocionais para Indexação

### Schema de Metadata

```yaml
swipe_id: [identificador único]
source: [nome do anunciante/VSL]
niche: [concursos | saude | relacionamento | riqueza]
format: [vsl | tsl | criativo | email]
emotional_triggers:
  - trigger: [nome do gatilho]
    intensity: [1-5]
    example: "[trecho específico]"
    principle: "[o que torna eficaz]"
```

---

## Os 14 Gatilhos (H&W + Cialdini)

| # | Gatilho | Descrição | Exemplo de Uso |
|---|---------|-----------|----------------|
| 1 | **FEAR** | Medo de perda, consequência negativa | "Se você não agir agora..." |
| 2 | **CURIOSITY** | Loop aberto, informação incompleta | "O ingrediente secreto que..." |
| 3 | **GREED** | Desejo de ganho, oportunidade | "Multiplique seus resultados..." |
| 4 | **ANGER** | Indignação contra vilão externo | "A indústria esconde de você..." |
| 5 | **GUILT** | Responsabilidade, dever | "Você deve isso à sua família..." |
| 6 | **EXCLUSIVITY** | Pertencimento a grupo seleto | "Apenas 3% das pessoas sabem..." |
| 7 | **FLATTERY** | Validação, reconhecimento | "Você é inteligente demais para..." |
| 8 | **SALVATION** | Esperança, solução divina | "Finalmente existe uma saída..." |
| 9 | **URGENCY** | Escassez temporal | "Nas próximas 24 horas..." |
| 10 | **SOCIAL_PROOF** | Validação por outros | "Mais de 50.000 pessoas já..." |
| 11 | **AUTHORITY** | Credenciais, expertise | "Desenvolvido por médicos da..." |
| 12 | **RECIPROCITY** | Dar antes de pedir | "Vou compartilhar gratuitamente..." |
| 13 | **COMMITMENT** | Coerência com decisões anteriores | "Se você chegou até aqui..." |
| 14 | **CONTRAST** | Antes/depois, comparação | "Enquanto outros gastam R$5.000..." |

---

## Processo de Decomposição

### ETAPA 1: Identificar Gatilhos

Para cada swipe, identificar:
1. Quais gatilhos estão presentes?
2. Qual a intensidade de cada um (1-5)?
3. Qual trecho exemplifica?

### ETAPA 2: Extrair Princípios

**NUNCA copiar texto. SEMPRE extrair o princípio.**

| Nível | O que copiar | Resultado |
|-------|--------------|-----------|
| ❌ Texto | "Você está cansado de acordar às 3AM?" | Copy idêntica (plágio) |
| ⚠️ Estrutura | Pergunta retórica sobre sintoma | Copy similar (genérica) |
| ✅ Princípio | Usar sintoma noturno específico para identificação | Copy única (adaptada) |

### ETAPA 3: Adaptar ao Contexto

```
PRINCÍPIO EXTRAÍDO:
"Usar sintoma específico do avatar como hook de identificação"

APLICAÇÃO NO CONTEXTO:
- Avatar: Concurseiros 30+
- Sintoma específico: Reler o mesmo artigo de lei 5x sem memorizar
- Hook adaptado: "Se você já releu o mesmo artigo 5 vezes e não lembra..."
```

---

## Template de Análise de Swipe

```markdown
## Swipe: [Nome/Identificador]

### Metadata
- **Source:** [anunciante]
- **Niche:** [nicho]
- **Format:** [VSL/TSL/Criativo]
- **Scale Score:** [se disponível]

### Gatilhos Identificados

| Gatilho | Intensidade | Trecho | Princípio |
|---------|-------------|--------|-----------|
| FEAR | 4/5 | "..." | [o que torna eficaz] |
| CURIOSITY | 5/5 | "..." | [o que torna eficaz] |

### Estrutura Decomposta

1. **Hook:** [tipo de hook usado]
   - Princípio: [por que funciona]

2. **Problema:** [como apresenta o problema]
   - Princípio: [por que funciona]

3. **Solução:** [como apresenta a solução]
   - Princípio: [por que funciona]

4. **CTA:** [como fecha]
   - Princípio: [por que funciona]

### Aplicação para [Oferta]

| Elemento Original | Princípio | Adaptação |
|-------------------|-----------|-----------|
| "..." | ... | "..." |
```

---

## Anti-Patterns de Swipe

| Anti-Pattern | Resultado | Solução |
|--------------|-----------|---------|
| Copiar texto | Plágio, sem diferenciação | Extrair princípio |
| Ignorar contexto | Não ressoa com avatar | Adaptar ao contexto |
| Usar muitos gatilhos | Overload, desconfiança | Max 3-4 por peça |
| Gatilhos genéricos | Copy commodity | Especificar por nicho |

---

## Checklist de Decomposição

Antes de usar swipe como referência:

- [ ] Identifiquei gatilhos presentes
- [ ] Extraí PRINCÍPIOS, não texto
- [ ] Adaptei ao MEU contexto/avatar
- [ ] Verifiquei que output é ÚNICO
- [ ] Rodei teste de genericidade

---

## Integração com voc_search

O MCP `voc_search` usa este schema para busca semântica:

```typescript
// Buscar por gatilho específico
voc_search({
  query: "medo de não passar no concurso",
  emotional_trigger: "FEAR",
  niche: "concursos",
  min_intensity: 4
})
```

---

*v6.1 - Baseado em Pesquisa Externa 05.md + Contextual Retrieval*
*Atualizado: 2026-01-30*
