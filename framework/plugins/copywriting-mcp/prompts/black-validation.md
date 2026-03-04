# BLACK Validation Prompt

> Framework BLACK v7.0 - Copy Chief Ecosystem
> "Copy confortável = Copy que FALHOU"

---

## Princípios BLACK

| Princípio | Descrição |
|-----------|-----------|
| **DRE-First** | DRE (Emoção Dominante Residente) é o driver primário. Pode ser medo, vergonha, desejo, raiva, inveja, culpa, frustração. |
| **Visceral > Lógico** | Copy deve fazer o corpo reagir, não só a mente entender. |
| **Específico = Cena de Filme** | Duas faces: DATA (números precisos) E NARRATIVA (memória dolorosa). Narrativa é mais poderosa. |
| **Zero Hesitação** | Nada de "pode ser", "talvez". Linguagem ABSOLUTA. |
| **Tom Calibrado** | Não é fixo. Definido pelo briefing e nicho. Spectrum de vulnerabilidade a raiva. |
| **Coerência > Verdade** | Coerência narrativa > verdade factual. Invenção densa é técnica. |

---

## 5 Lentes de Validação

### Lente 1: ESPECIFICIDADE = CENA DE FILME (BLOCKING)

**Duas Faces Obrigatórias:**

**Face DATA (4 itens):**
- [ ] Nome próprio (não "pessoas", "clientes")
- [ ] Idade específica ou profissão específica
- [ ] Número não-redondo (87.3%, não 90%)
- [ ] Data específica (14 de março) ou localização específica

**Face NARRATIVA (4 itens - MAIS PODEROSA):**
- [ ] Memória dolorosa específica (não estatística)
- [ ] Detalhe sensorial (acordou 3AM suando)
- [ ] Consequência pessoal (não número solto)
- [ ] Cena visualizável ("consigo ver o filme")

**Score ≥6/8 para aprovar. Narrativa vale MAIS.**

---

### Gate 2: MECANISMO PROPRIETÁRIO (BLOCKING)

**Fórmula:** `[ÓRGÃO] + [PROCESSO] + [CAUSA]`

**Exemplos:**
| Nicho | Mecanismo |
|-------|-----------|
| Emagrecimento | "Bloqueio da Leptina por Cortisol Crônico" |
| ED | "Obstrução do Óxido Nítrico por Calcificação" |
| Concursos | "Fragmentação do Hipocampo por Estudo Ineficiente" |

**Checklist:**
- [ ] Nome PROPRIETÁRIO
- [ ] Termos REAIS distorcidos (parece científico)
- [ ] EXPLICA por que outras soluções falharam
- [ ] Cria URGÊNCIA (se não tratar, piora)

---

### Lente 2: ESCALADA EMOCIONAL (BLOCKING)

**DRE (Emoção Dominante Residente) - 5 Níveis:**

Aplicável a QUALQUER emoção (não só medo):
- Medo, vergonha, desejo, raiva, inveja, culpa, frustração

| Nível | Tipo | Exemplo (Medo) | Exemplo (Desejo) |
|-------|------|----------------|------------------|
| 1 | Curto prazo | "Vergonha na prova" | "Quero passar logo" |
| 2 | Médio prazo | "Carreira estagnada" | "Quero estabilidade" |
| 3 | Longo prazo | "Nunca conseguir" | "Quero mudar de vida" |
| **4** | **Relacional** | **"Decepcionar família"** | **"Orgulhar os pais"** |
| **5** | **Identidade** | **"Ser fracassado"** | **"Ser vencedor"** |

> **Copy BLACK deve ativar níveis 4 ou 5 da DRE definida no briefing.**

**Checklist:**
- [ ] DRE está identificada no briefing?
- [ ] Prospect consegue SE VER na situação
- [ ] Copy deixa prospect "sentir no corpo" (reação física)
- [ ] Emoção é visceral, não intelectual

---

### Lente 3: LOGO TEST

**Pergunta única:**
> "Se eu trocar o logo para o concorrente, ainda funciona?"

- [ ] Mecanismo é PROPRIETÁRIO (não genérico)
- [ ] Nome do produto/método aparece
- [ ] Elementos ÚNICOS da oferta presentes
- [ ] Prova social é ESPECÍFICA (nomes, números, datas)

**Se concorrente pode usar sem alterar → REFAZER**

---

### Lente 4: TESTE VISCERAL

**Pergunta única:**
> "A copy me fez sentir algo no CORPO?"

- [ ] Prospect consegue SE VER na situação
- [ ] Reação FÍSICA (não só mental)
- [ ] Emoção é visceral, não abstrata
- [ ] "Sua" ou "fica confortável"?

**Confortável = FALHOU. Refazer.**

---

### Lente 5: ZERO HESITAÇÃO

**Proibido:**
- "pode ser", "talvez", "provavelmente"
- "sob certas condições", "em alguns casos"
- Marketing speak: "inovador", "revolucionário"

**Obrigatório:**
- Linguagem ABSOLUTA: "vai", "é", "garante"
- Expert SABE, não "acha" ou "acredita"
- Tom calibrado pelo briefing (não fixo)

---

## Coerência Narrativa > Verdade Factual

**Princípio Novo (v7.0):**
> "Invenção densa é técnica. Coerência importa mais que verdade factual."

**Checklist de Coerência:**
- [ ] Todos os claims servem ao MESMO mecanismo
- [ ] Não há CONTRADIÇÕES internas
- [ ] Cadeia lógica completa: Problema → Mecanismo → Solução → Urgência
- [ ] Detalhes inventados são COERENTES entre si
- [ ] Especificidade cria credibilidade (não precisa ser factual)

---

## Scoring

| Lentes Passadas | Score | Decisão |
|-----------------|-------|---------|
| 5/5 | 10/10 | ✅ APROVADO BLACK |
| 4/5 | 8/10 | ✅ APROVADO (corrigir 1 lente) |
| 3/5 | 6/10 | ⚠️ REVISAR |
| ≤2/5 | <6/10 | ❌ REFAZER |

**CRÍTICO:** Se QUALQUER lente BLOCKING falhar = auto-REFAZER
**BLOCKING:** Lente 1 (Especificidade), Lente 2 (Escalada Emocional)

---

## Pergunta Final

> "Se eu mostrar esta copy para o avatar mais cético do nicho,
> ele vai sentir o medo no corpo ou vai rolar os olhos?"
>
> **Rolar os olhos = REFAZER**

---

## Output Esperado

```json
{
  "dre_identificada": "medo|vergonha|desejo|raiva|inveja|culpa|frustração",
  "lentes": [
    {
      "name": "Especificidade (Cena de Filme)",
      "score_data": X/4,
      "score_narrativa": X/4,
      "score_total": X/8,
      "passed": true/false,
      "blocking": true
    },
    {
      "name": "Escalada Emocional (DRE)",
      "nivel_atingido": "1-5",
      "score": X,
      "passed": true/false,
      "blocking": true
    },
    { "name": "Logo Test", "score": X, "passed": true/false },
    { "name": "Teste Visceral", "score": X, "passed": true/false },
    { "name": "Zero Hesitação", "score": X, "passed": true/false }
  ],
  "coerencia_narrativa": X,
  "total_score": X,
  "blocking_failed": true/false,
  "veredicto": "APROVADO | REVISAR | REFAZER",
  "acoes_prioritarias": ["..."]
}
```

---

## Copy para Validar

[INSERIR COPY AQUI]

---

*BLACK Framework v7.0 - Copywriting Ecosystem*
*"Copy confortável = Copy que FALHOU"*
*Fundamentos Universais v5: DRE-First, Escalada Emocional, Especificidade = Cena de Filme*
