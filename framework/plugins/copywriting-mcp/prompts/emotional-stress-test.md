# Emotional Stress Test - 4 Testes

> Fonte: Pesquisa 03.md - Artificial Hivemind + Fundamentos Universais v5
> Valida ressonância emocional, não apenas lógica

---

## Teste 1: GENERICIDADE (40% peso)

**Pergunta:** Esta copy poderia ser usada por um concorrente SEM alteração?

| Score | Significado |
|-------|-------------|
| 1-3 | Altamente genérica - qualquer um usaria |
| 4-5 | Parcialmente genérica - precisa adaptar |
| 6-7 | Relativamente única - reconhecível |
| 8-10 | Distintiva - impossível copiar |

**Threshold 2026:** Score < 8 = REFAZER

**Validação de Especificidade:**
- [ ] DATA presente (números não-redondos, nomes, datas)?
- [ ] NARRATIVA presente (memória dolorosa, cena visualizável)?
- [ ] Narrativa > Data em poder emocional?

---

## Teste 2: VISCERAL vs CEREBRAL (25% peso)

**Pergunta:** O leitor SENTE ou apenas ENTENDE?

**DRE (Emoção Dominante Residente) está ativa?**
- Medo, vergonha, desejo, raiva, inveja, culpa, frustração

Qual parte do corpo reagiria?
- **Estômago:** Medo, ansiedade, culpa, vergonha
- **Peito:** Desejo, raiva, frustração
- **Coração:** Amor, conexão, pertencimento
- **Mente:** Curiosidade, lógica, análise (EVITAR)

| Score | Significado |
|-------|-------------|
| 1-2 | Puramente cerebral - só informação |
| 3-4 | Misto - alguma emoção |
| 5 | Visceral - reação física imediata na DRE correta |

---

## Teste 3: SCROLL-STOP (20% peso)

**Pergunta:** Em feed infinito (Instagram/TikTok), isso PARA o dedo?

| Score | Significado |
|-------|-------------|
| 1-2 | Passa batido - previsível |
| 3-4 | Talvez pare - interessante |
| 5 | Para imediatamente - surpreendente |

**Avaliar:**
- Hook surpreendente ou esperado?
- Pattern interrupt presente?
- Curiosidade genuína?

---

## Teste 4: PROVA SOCIAL IMPLÍCITA (15% peso)

**Pergunta:** "Pessoas como eu" usam isso?

| Score | Significado |
|-------|-------------|
| 1-2 | Sem identificação tribal |
| 3-4 | Identificação parcial |
| 5 | "Isso é para mim" - pertencimento claro |

**Elementos:**
- Linguagem do grupo
- Referências culturais
- Exclusividade/pertencimento

---

## Output Esperado

```json
{
  "genericidade": {
    "score": X,
    "justificativa": "..."
  },
  "visceral": {
    "score": X,
    "parte_corpo": "estomago|coracao|mente",
    "justificativa": "..."
  },
  "scroll_stop": {
    "score": X,
    "justificativa": "..."
  },
  "prova_social": {
    "score": X,
    "justificativa": "..."
  },
  "media_ponderada": X,
  "veredicto": "APROVADO | REVISAR | REFAZER",
  "acoes_prioritarias": ["...", "..."]
}
```

## Ponderação

- Genericidade: 40% (mais importante em 2026)
- Visceral: 25%
- Scroll-stop: 20%
- Prova social: 15%

---

## Copy para Testar

[INSERIR COPY AQUI]
