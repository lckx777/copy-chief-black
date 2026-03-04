---
template_name: "niche-pack-cliches"
template_version: "1.0.0"
template_type: "niche-pack"
description: "Template de cliches proibidos por nicho para anti-homogeneizacao"
phase: "production"
output_format: "markdown"
---

# Cliches Proibidos — {{NICHE_DISPLAY}}

> **Ref:** anti-homogeneization.md (v7.0)
> **Criado:** {{DATE}}
> **Regra Cardinal:** Copy que poderia ser usada por concorrente SEM alteracao = REFAZER

---

## Cliches Especificos do Nicho

{{CLICHES_TABLE}}

---

## Palavras Banidas (Cross-Nicho)

### Adjetivos Vazios
- revolucionario, inovador, incrivel, inacreditavel
- unico (sem especificacao), exclusivo (sem prova)
- simples (sem demonstracao), facil (sem evidencia)

### Substantivos Genericos
- segredo, metodo, sistema (sem nome proprio)
- transformacao, jornada, caminho
- solucao, resposta, chave

### Verbos IA-Speak
- revolucionar, transformar, elevar, desbloquear
- empoderar, potencializar, alavancar

### Estruturas Banidas
- "In today's [adjetivo] world"
- "Introducing..."
- "What if I told you..."
- "The secret to..."
- "Finally, a solution..."
- "Imagine..."
- "X meets Y"

---

## Enforcement

Antes de entregar qualquer copy:
- [ ] Logo Test: passaria se trocar logo?
- [ ] Competitor Swap Test: concorrente usaria?
- [ ] Tem nome proprietario para mecanismo?
- [ ] Tem numeros especificos (nao round)?
- [ ] Tem exemplos unicos da oferta?
- [ ] Linguagem e da VOC (nao generica)?
- [ ] Zero palavras da lista de banidos?

---

*Criado via create-niche-pack em {{DATE}}*
