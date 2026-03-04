---
phases: [PRODUCTION, REVIEW]
paths:
  - "production/**/*.md"
priority: CRITICAL
tokens: ~2000
---

# Copy Chief Rules (v7.0)

> Regras de validação de copy e quality gates.
> Extraído de CLAUDE.md para modularização.
> **v7.0:** Alinhado com Fundamentos Universais v5 (DRE, 5 Lentes, Escalada Emocional)

---

## 🚨 BLACK REJECTION GATE (OBRIGATÓRIO)

> **REGRA:** Copy confortável = Copy que FALHOU.
> Se não ativa a DRE (Emoção Dominante Residente) de forma visceral, NÃO sai do sistema.

### Gate de Rejeição Automática

**ANTES de aprovar QUALQUER copy, verificar pelas 5 Lentes:**

| Lente | ❌ REJEITAR | ✅ APROVAR |
|-------|-------------|------------|
| 1. Escalada Emocional | DRE leve, abstrata, fica nos níveis 1-2 | DRE visceral, escala até nível 4-5, prospect sente no corpo |
| 2. Densidade Narrativa | Genérico, round numbers, sem cena | Nomes, cidades menores, números não-redondos, cena de filme |
| 3. Logo Test | Concorrente usaria sem alterar | Impossível confundir, mecanismo proprietário |
| 4. Teste Visceral | Prospect passa "de boa" | Ativa reação física/emocional forte |
| 5. Zero Hesitação | "pode ser", "talvez", marketing speak | Absoluta, expert SABE, zero condicional |

### Decisão

```
5 LENTES FORTES?
├── 5/5 → Copy sólida, pronta para teste no mercado
├── 4/5 → Identificar e fortalecer lente fraca
├── 3/5 → Revisar — fraquezas comprometem conversão
└── ≤2/5 → REFAZER — gaps estruturais
```

### Feedback de Rejeição

```
❌ COPY REJEITADA - Lente fraca: [qual lente falhou]

Exemplo de feedback:
- "Escalada Emocional fraca. DRE fica no nível 2 (social). Escalar até nível 4-5 (relacional/identidade)."
- "Densidade Narrativa insuficiente. Parece press release, não cena de filme. Adicionar detalhes sensoriais."
- "Logo Test FALHOU. Concorrente usaria sem alterar. Adicionar mecanismo proprietário."
```

---

## Copy Chief Validation Gate (v2.4)

> **Problema:** IA ignora arquivos obrigatórios mesmo quando listados.
> **Solução:** Exigir EVIDÊNCIA visível de leitura antes de aceitar copy.

### Regra de Validação

**ANTES de aceitar qualquer copy produzida, verificar:**

| Critério | Rejeitar | Aceitar |
|----------|----------|---------|
| Tem seção "GATE: Arquivos Lidos"? | Não | Sim |
| Elementos são ESPECÍFICOS? | "Li o arquivo" | "Sinestesia: acordar 3AM sem fome" |
| Swipes são do nicho correto? | Aleatórios | Coerentes com contexto |
| Erros listados são relevantes? | Genéricos | Específicos para este criativo |

**Sem secao GATE** -> Rejeitar ("Refaca lendo arquivos obrigatorios").
**Elementos genericos** -> Rejeitar ("Releia e extraia exemplos ESPECIFICOS").

---

## Quality Gates - ENFORCEMENT OBRIGATORIO

**NUNCA** declarar gate "PASSED" manualmente. **SEMPRE** rodar validacao:

| Gate | Validacao | Criterio |
|------|-----------|----------|
| **Research** | `validate-gate.py RESEARCH path/to/offer` | 7 deliverables bloqueantes (0=PASS, 1=BLOCKED) |
| **Briefing** | 10 phases complete + copy-critic STAND | Manual |
| **Production** | Internal review >= 12/16 | Manual |

> Ref: voc-research.md § Research Gate - Deliverables e Validacao para checklist completo.

---

## Cognitive-Affective Gap (Pesquisa 06)

> Copy pode ser logicamente perfeita mas emocionalmente falha.

### 5 Perguntas Stress-Test (OBRIGATORIO antes de aprovar copy final)

1. Qual seria a primeira objecao do cetico mais duro do nicho?
2. Qual frase faria alguem rolar os olhos e fechar a pagina?
3. Tirando toda promessa, so a prova convence?
4. Lendo so as headlines, entende a transformacao completa?
5. Tem ponto onde parece vender em vez de ajudar?

### 4 Testes de Validacao Emocional

| Teste | Prompt |
|-------|--------|
| Dissonancia Cognitiva | "3 pontos onde copy afirma X mas implica Y" |
| Fadiga de Prova | "Onde prova vira inseguranca" |
| Promessa vs Realidade | "% do publico que consegue realisticamente" |
| Gatilho de Desconfianca | "Frase que ativa bullshit detector" |

**Sequencia:** CRITIC Framework -> Cognitive-Affective Gap -> Validacao Emocional -> Two-Model Validation

---

## CRITIC Framework (Pesquisa 6)

**Fluxo:** Output inicial -> Tools (checklist, VOC, briefing) -> Avaliacao ESPECIFICA -> Revisao -> Output melhorado.

**Validacao Estruturada** (NAO impressao subjetiva): MUP alinhado (RMBC), MUS espelha MUP, VOC presente (quotes especificas), Especificidade (numeros, nomes, exemplos).

**Two-Model Validation:** Modelo DIFERENTE para criticar (evita vieses). Producao: Sonnet/Opus. Critica: Opus (se Sonnet produziu).

**Courtroom Model** (MUP/MUS/One Belief): Advocate (defende) + Challenger (questiona) + Judge (decide STAND/REVISE). Verdict baseado em criterios, nao impressao.

| Anti-Pattern | Correto |
|--------------|---------|
| "A copy esta boa" | "MUP cumpre 3/3 criterios RMBC" |
| "Li o arquivo" | "Sinestesia extraida: acordar 3AM sem fome" |
| "Parece persuasivo" | "VOC triangulada em 3 fontes" |

---

## 5 Lentes de Validação (Fundamentos v5)

As 5 lentes são ferramentas de DIAGNÓSTICO para identificar fraquezas. O teste final é sempre performance no mercado real.

### Lente 1: Escalada Emocional

A DRE (definida no briefing) deve escalar de superficial a existencial:

| Nível | Tipo | Horizonte | Descrição |
|-------|------|-----------|-----------|
| 1 | Físico Imediato | Horas/dias | Desconforto corporal, sintomas |
| 2 | Social | Dias/semanas | Julgamento, vergonha pública |
| 3 | Consequência | Meses/anos | Doença crônica, dependência, falência |
| 4 | Relacional | Permanente | Perda de parceiro, solidão, família |
| 5 | Identidade | Existencial | Quem você se torna, legado, morte |

- [ ] A DRE da oferta está ativada? (não necessariamente medo — pode ser vergonha, desejo, raiva, frustração)
- [ ] A intensidade escala do superficial ao existencial?
- [ ] A emoção alcança profundidade 4-5 suficiente para gerar ação?
- [ ] O prospect sente a emoção no corpo?

**Pergunta:** "Um prospect REALMENTE sentiria isso? Ou é abstrato e superficial?"

### Lente 2: Densidade Narrativa

Duas faces da especificidade — AMBAS válidas, narrativa é MAIS poderosa:

**Face 1: Dados Específicos**
- [ ] Tem NOME próprio (não "pessoas", "clientes")
- [ ] Tem IDADE específica
- [ ] Tem CIDADE menor (não "todo Brasil")
- [ ] Tem PROFISSÃO específica (não "empresário")
- [ ] Tem NÚMERO não-redondo (87.3%, não 90%)
- [ ] Tem DATA específica (14 de março, não "recentemente")
- [ ] Tem RESULTADO com métrica (pressão 124/81, não "melhorou")

**Face 2: Narrativa Específica (cena de filme)**
- [ ] Cena tão vívida que o prospect se enxerga dentro
- [ ] DETALHES SENSORIAIS que transportam (visão, audição, tato, olfato, paladar, propriocepção)
- [ ] Reação de TERCEIROS (marido perguntou, médico espantou, filha notou)
- [ ] Contexto INESPERADO (o lugar, a hora, a circunstância)

**Pergunta:** "Parece cena de filme ou press release?"

### Lente 3: Logo Test

- [ ] Concorrente NÃO pode usar sem mudar?
- [ ] Mecanismo tem NOME PROPRIETÁRIO?
- [ ] Mecanismo usa TERMOS REAIS distorcidos (pâncreas, cortisol, hipocampo)
- [ ] Mecanismo EXPLICA o problema de forma plausível DENTRO DA HISTÓRIA
- [ ] Mecanismo JUSTIFICA por que outras soluções falharam
- [ ] Se tirar o nome do produto, a copy ainda é única?

**Pergunta:** "Um concorrente poderia usar essa copy sem alterar nada?"

### Lente 4: Teste Visceral

- [ ] Ativa reação física/emocional forte, não só mental?
- [ ] Prospect "sentiria" algo lendo/assistindo?
- [ ] Copy deixa desconfortável?
- [ ] Coerência narrativa total (contradição = morte da copy)
- [ ] Todos os claims servem ao MESMO mecanismo
- [ ] Cadeia lógica: Problema → Mecanismo → Por que nada funcionou → Solução → Urgência

**Pergunta:** "A copy me fez sentir algo no corpo? Ou só na mente?"

### Lente 5: Zero Hesitação

- [ ] ZERO "pode ser", "talvez", "sob certas condições"
- [ ] ZERO marketing speak ("inovador", "revolucionário", "solução", "metodologia")
- [ ] Linguagem ABSOLUTA ("você vai", "é garantido")
- [ ] Expert SABE, não "acha" ou "acredita"
- [ ] Tom CONGRUENTE com narrador e oferta (definido no briefing)

**Pergunta:** "Existe alguma hesitação, linguagem condicional ou marketing speak?"

### Tabela de Decisão

| Lentes Fortes | Indicação |
|---------------|-----------|
| **5/5** | Copy sólida — pronta para teste no mercado |
| **4/5** | Identificar e fortalecer a lente fraca |
| **3/5** | Revisar — fraquezas provavelmente comprometem conversão |
| **≤2/5** | Repensar a abordagem — gaps estruturais |

### Checklist Detalhado (Complementar às 5 Lentes)

#### Mecanismo

- [ ] Fórmula: [ÓRGÃO REAL] + [PROCESSO INVENTADO] + [CAUSA EXTERNA CULPÁVEL]
- [ ] 5 funções: Explica, Absolve, Invalida, Posiciona, Cria urgência
- [ ] Invenção FORTE (densa em detalhes) não FRACA (genérica)

#### Exclusividade Tribal

- [ ] Posiciona prospect como parte de grupo SELETO
- [ ] Senso de DESCOBERTA SECRETA
- [ ] Superioridade epistêmica ("eu sei algo que outros não sabem")
- [ ] Inimigo externo identificado

#### Elementos de Escrita (v5)

- [ ] Frases de poder nos momentos certos
- [ ] Disparos de dopamina distribuídos (reengajam nos trechos técnicos)
- [ ] Future pacing (cenário positivo E negativo com timeframe específico)
- [ ] Estrutura ABT (AND → BUT → THEREFORE)
- [ ] Cadeia lógica A-B-C

### Stress Test BLACK (5 perguntas finais)

Se QUALQUER resposta for negativa -> copy precisa de trabalho:
DRE visceral? | Logo Test passa? | Unica sem nome do produto? | Sentiu no corpo? | Compraria nessa situacao?

---

*v7.0 - Alinhado com Fundamentos Universais v5 (DRE, 5 Lentes, Escalada Emocional)*
*Ref: tool-usage-matrix.md para ferramentas obrigatórias por fase*
*Hooks: tool-enforcement-gate.ts, post-production-validate.ts*
*Atualizado: 2026-02-07*
