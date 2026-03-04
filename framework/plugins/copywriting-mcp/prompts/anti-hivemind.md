# Anti-Hivemind Constraints

> Fonte: Pesquisa 05.md
> Problema: 79% similaridade intra-modelo, 71-82% cross-modelo
> Causa: Treinamento em dados comuns, RLHF convergente

---

## OBRIGATÓRIO: Escrever SEM usar

### Palavras Banidas
- elevate
- seamless
- unlock
- dive (into)
- leverage
- journey
- empower
- revolutionize
- game-changer
- cutting-edge

### Estruturas Banidas
- "X meets Y"
- "In today's [adjetivo] world"
- "Introducing..."
- "Imagine..."
- "What if I told you..."
- "The secret to..."
- "Finally, a solution that..."

### Metáforas Banidas
- Jornadas (journey)
- Rios (flow, stream)
- Luz (illuminate, shine)
- Transformação genérica

### Aberturas Banidas
- "Have you ever..."
- "Are you tired of..."
- "What if there was..."
- "Picture this..."

---

## SUBSTITUIÇÕES RECOMENDADAS

| Genérico | Específico |
|----------|------------|
| "elevate your life" | "[ação específica] para [resultado mensurável]" |
| "seamless experience" | "[processo] sem [fricção específica]" |
| "unlock your potential" | "[habilidade] para conseguir [resultado]" |
| "transformative journey" | "[período] de [mudança específica]" |

---

## Teste de Genericidade

Antes de aprovar, perguntar:
1. "Um concorrente poderia usar esta copy sem alterar?"
2. "Há números, nomes, exemplos ÚNICOS?"
3. "A voz é reconhecível ou intercambiável?"

Se SIM para #1 → REFAZER
Se NÃO para #2 e #3 → REVISAR

---

## Prompt de Geração com Constraints

```
Escreva [tipo de copy] para [contexto].

RESTRIÇÕES OBRIGATÓRIAS:
- NÃO use: elevate, seamless, unlock, dive, leverage
- NÃO use estrutura "X meets Y"
- NÃO abra com "In today's [adjetivo] world"
- NÃO use metáforas de jornadas, rios ou luz
- USE números específicos, nomes reais, exemplos concretos
- ESCREVA como conversa, não como texto polido

O resultado deve ser impossível de confundir com copy de concorrente.
```

---

## BLACK Framework v7.0 Integration

> **Copy que poderia ser usada por concorrente SEM alteração = REFAZER**

### 5 Lentes BLACK (Validação Obrigatória)

| Lente | Descrição | Blocking? |
|-------|-----------|-----------|
| 1. Especificidade = Cena de Filme | DATA + NARRATIVA (narrativa > data) | ✅ SIM |
| 2. Escalada Emocional (DRE) | Níveis 4-5 de qualquer DRE | ✅ SIM |
| 3. Logo Test | Impossível concorrente usar | ❌ NÃO |
| 4. Teste Visceral | Reação no corpo, não mente | ❌ NÃO |
| 5. Zero Hesitação | Linguagem absoluta, tom calibrado | ❌ NÃO |

### Escalada Emocional (BLACK v7.0)

DRE = Emoção Dominante Residente (medo, vergonha, desejo, raiva, inveja, culpa, frustração)

| Nível | Tipo | Aplicável a qualquer DRE |
|-------|------|--------------------------|
| 4 | Relacional | "Como afeta quem você ama" |
| 5 | Identidade | "Quem você se torna" |

> **Copy BLACK deve ativar níveis 4 ou 5 da DRE definida no briefing.**

### Pergunta Final

> "Se eu mostrar esta copy para o avatar mais cético do nicho,
> ele vai sentir a DRE no corpo ou vai rolar os olhos?"
>
> Rolar os olhos = REFAZER
>
> **NOVO:** Tom não é fixo. Calibrado pelo briefing (vulnerabilidade → raiva spectrum).

---

*Baseado em pesquisa Artificial Hivemind (NeurIPS 2025) + BLACK Framework v6.4*
