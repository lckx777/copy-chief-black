# Constraint Progressivo Protocol (v1.0)

> Protocolo para aplicacao progressiva de constraints na producao de copy
> Principio AIOS: "Comecar amplo, restringir progressivamente. Gera solucoes mais criativas do que todos os constraints de uma vez."
> Ref: aios-principles.md #19 (Constraint Progressivo)
> Ref: anti-homogeneization.md (constraints de divergencia)
> Criado: 2026-02-26

---

## Principio Fundador

> **"Constraints progressivos guiam sem sufocar. Todos de uma vez = copy rigida."**
>
> A IA sob muitos constraints simultaneos converge para o padrao mais seguro — que e o mais generico.
> Aplicar constraints em camadas permite exploracao criativa ANTES de restringir.
> Resultado: copy mais criativa E mais alinhada (nao um OU outro).

---

## Regra Cardinal

> **Iteracao 1 NUNCA tem constraints de validacao (Logo Test, blind_critic, etc).**
> Iteracao 1 e EXPLORACAO. Validacao vem nas iteracoes 3-4.
> Injetar validacao na Iteracao 1 = matar criatividade antes de nascer.

---

## Template de 4 Iteracoes

### Iteracao 1: Exploracao Livre (Divergente)

**Constraints aplicados:** ZERO de validacao. Apenas direcao estrategica.

**Prompt type:**
```
"Como abordaria [deliverable] para [oferta]?
Considere a DRE do avatar: [emocao]
Considere o MUP: [mecanismo]
Gere [3-5] abordagens ESTRUTURALMENTE diferentes."
```

**O que entra:**
- Direcao estrategica (DRE, MUP, MUS, avatar)
- Tipo de deliverable
- Contexto minimo da oferta

**O que NAO entra:**
- Anti-homogeneizacao (cliches proibidos)
- Logo Test
- Specificity thresholds
- Checklists de validacao
- Scores minimos

**Output esperado:** 3-5 abordagens diferentes. Podem ser cruas, imperfeitas, ate ridiculas. O objetivo e DIVERGIR.

---

### Iteracao 2: Restricao Emocional + Estrutural

**Constraints adicionados:** DRE especifica + Estrutura do deliverable.

**Prompt type:**
```
"Agora refine a abordagem [escolhida/melhor].
Considere:
- DRE: [emocao] escalada ate nivel [4-5]
- Fluxo Emocional por Unidade Persuasiva:
  - Unidade [N]: entrada=[X] → saida=[Y] (DRE level [Z])
  - Unidade [N+1]: entrada=[Y] → saida=[W] (DRE level [Z+1])
  Ref: persuasion-chunking.md
- Estrutura: [capitulos/blocos/hook-body-cta]
- VOC: use estas quotes reais: [quotes]"
```

**O que entra:**
- DRE com nivel de escalada
- Mapa de unidades persuasivas com entrada/saida emocional (persuasion-chunking.md)
- Estrutura especifica do deliverable
- VOC quotes reais (language-patterns.md)
- Dados do avatar (sinestesia da rotina)

**O que NAO entra:**
- Logo Test (ainda nao)
- Anti-homogeneizacao (ainda nao)
- Scores formais

**Output esperado:** Draft estruturado, emocionalmente alinhado, com VOC real. Pode ter cliches. Pode falhar no Logo Test. Isso e corrigido na iteracao 3.

---

### Iteracao 3: Restricao de Especificidade + Anti-Homogeneizacao

**Constraints adicionados:** Logo Test + Specificity + Anti-cliches.

**Prompt type:**
```
"Agora aplique restricoes de qualidade:

1. LOGO TEST: Concorrente poderia usar esta copy sem alterar?
   SE SIM → adicionar mecanismo proprietario, nome unico, dados especificos

2. SPECIFICITY (>= 8/10):
   - Face 1 (Dados): Nomes, idades, cidades, numeros nao-redondos, datas
   - Face 2 (Narrativa): Cena de filme, reacao de terceiros, detalhes sensoriais

3. ANTI-HOMOGENEIZACAO:
   - Verificar lista de cliches do nicho [lista]
   - Verificar palavras banidas [lista]
   - Substituir por linguagem VOC especifica

4. ZERO HESITACAO:
   - Eliminar: 'pode ser', 'talvez', 'possivelmente'
   - Linguagem absoluta, expert SABE"
```

**O que entra:**
- Logo Test criteria
- Specificity checklist (Face 1 + Face 2)
- Cliches proibidos do nicho (anti-homogeneization.md)
- Palavras banidas
- Zero Hesitacao

**Output esperado:** Copy especifica, unica, sem cliches, com linguagem absoluta. Pronta para validacao formal.

---

### Iteracao 4: Validacao Formal + Polish

**Constraints adicionados:** MCPs de validacao + 5 Lentes.

**Acoes:**
```
1. blind_critic → score + feedback
   SE < 8: corrigir targeted, re-submeter (max 3x)

2. emotional_stress_test → genericidade + visceral + scroll_stop
   SE genericidade < 8: aplicar anti-homogeneizacao mais agressiva

3. 5 Lentes de Validacao:
   [ ] Escalada Emocional (nivel 4-5?)
   [ ] Densidade Narrativa (cena de filme?)
   [ ] Logo Test (concorrente nao usaria?)
   [ ] Teste Visceral (sente no corpo?)
   [ ] Zero Hesitacao (zero condicional?)

4. layered_review (3 camadas):
   Camada 1: Cortar excessos
   Camada 2: Aumentar visceralidade
   Camada 3: Testar em voz alta

5. black_validation → gate final (>= 8/10)
```

**Output esperado:** Copy validada, polida, pronta para entrega ao humano para aprovacao final.

---

## Aplicacao por Tipo de Deliverable

### VSL (8 Capitulos)

| Iteracao | Scope | Constraints |
|----------|-------|-------------|
| 1 | VSL inteira | Direcao estrategica (DRE, MUP, arc narrativo). 3 abordagens de lead |
| 2 | Capitulo por capitulo | DRE escalada + VOC + estrutura (Lead, Background, Tese, MUP, MUS, Buildup, Oferta, Close) |
| 3 | Capitulo por capitulo | Logo Test + Specificity + Anti-cliches + Anti-vicios IA (fragmentos, cortes, conversacao) |
| 4 | VSL completa | blind_critic por capitulo + EST na VSL inteira + layered_review 3 camadas + black_validation |

**Nota:** Iteracoes 2-3 sao por CAPITULO (chunked, nao monolitico). Iteracao 4 valida o todo.

### Landing Page (14 Blocos)

| Iteracao | Scope | Constraints |
|----------|-------|-------------|
| 1 | LP inteira | Direcao estrategica. 3 abordagens de headline + hero section |
| 2 | Bloco por bloco | Funcao persuasiva de cada bloco + VOC + dados do avatar |
| 3 | Bloco por bloco | Logo Test + Specificity + objecoes endereçadas no ponto certo |
| 4 | LP completa | blind_critic por bloco + EST na LP inteira + layered_review + black_validation |

### Criativo (Hook + Body + CTA)

| Iteracao | Scope | Constraints |
|----------|-------|-------------|
| 1 | Criativo inteiro | 5+ hooks divergentes. 3Ms definidos (Misterio, Mecanismo, Mercado). Angulo escolhido |
| 2 | Hook + Body + CTA | DRE no hook (0-3s) + NUUPPECC (4+ atributos) + sinestesia da rotina + future pacing |
| 3 | Copy completa | Logo Test + Specificity + cliches do nicho eliminados + FORMATO vs ANGULO validado |
| 4 | Copy final | blind_critic + EST genericidade >= 8 + black_validation |

### Email Sequence (7 Emails)

| Iteracao | Scope | Constraints |
|----------|-------|-------------|
| 1 | Sequencia inteira | Arc emocional da sequencia. DRE que escala email a email. 3 abordagens de welcome |
| 2 | Email por email | DRE + VOC + estrutura (Welcome, Story, Problem, Solution, Proof, Offer, Close) |
| 3 | Email por email | Subject lines com Logo Test + Specificity + anti-cliches + open loops entre emails |
| 4 | Sequencia completa | blind_critic por email + EST na sequencia + black_validation |

### MUP/MUS (Mecanismo Unico)

| Iteracao | Scope | Constraints |
|----------|-------|-------------|
| 1 | MUP | 5 candidatos de Nova Causa + Sexy Cause. Divergencia maxima |
| 2 | MUP refinado | RMBC criteria (Digerivel, Unico, Provavel, Conectado). Escolher TOP 3 |
| 3 | MUP + MUS | Logo Test + Gimmick Name (chiclete + ingrediente) + Origin Story + Authority Hook |
| 4 | MUP + MUS validados | consensus (TOP 3 MUPs) + blind_critic >= 8 (MUP e MUS) + EST >= 8 (MUP+MUS juntos) + voc_search |

### Microlead (PONTE Criativo → VSL)

| Iteracao | Scope | Constraints |
|----------|-------|-------------|
| 1 | Criativo fonte | EXTRAIR: Voz, POV, Tom, Elementos Visuais, Mecanismo mencionado. ZERO producao |
| 2 | Microlead draft | ESPELHAR criativo: mesma voz, mesmo POV, mesmo tom. Formato ROTEIRO DE VIDEO |
| 3 | Microlead refinada | Congruencia Criativo→Microlead (voz, POV, tom). Especificidade TEASE (nao PROVE). Anotacoes de video |
| 4 | Microlead validada | blind_critic (congruencia, nao emocao) >= 8 + Checklist Microlead (nao Checklist Lead) |

**Constraints ESPECIFICOS de Microlead (diferentes de outros deliverables):**

| Constraint | Valor para Microlead | Valor para Outros |
|------------|---------------------|-------------------|
| Voz/POV | HERDAR do criativo | Definir no briefing |
| Especificidade | TEASE (vago) | PROVE (especifico) |
| DRE | CONFIRMAR (nao escalar) | ESCALAR (nivel 4-5) |
| Formato | ROTEIRO DE VIDEO | Texto ou outro |
| Validacao primaria | CONGRUENCIA | EMOCAO + ESPECIFICIDADE |
| Logo Test | NAO se aplica | Aplica |

> **ATENCAO:** Microlead NAO segue o template padrao de 4 iteracoes para producao de copy.
> Microlead segue template de PONTE — a funcao e ESPELHAR, nao PERSUADIR.

---

## Integracao com Anti-Homogeneizacao

### Quando Aplicar (Iteracao 3, NAO Antes)

```
Iteracao 1: Explorar SEM anti-homogeneizacao
  → Permite ideias que parecem cliche mas podem ser refinadas

Iteracao 2: Estruturar SEM anti-homogeneizacao
  → Permite focar em emocao e estrutura sem restricao adicional

Iteracao 3: AGORA aplicar anti-homogeneizacao
  → Cliches proibidos do nicho (anti-homogeneization.md)
  → Palavras banidas (cross-nicho)
  → Estruturas banidas
  → Logo Test + Competitor Swap Test

Iteracao 4: VALIDAR anti-homogeneizacao
  → emotional_stress_test genericidade >= 8
  → Se < 8: re-aplicar constraints da Iteracao 3 mais agressivamente
```

### Por Que NAO na Iteracao 1

| Cenario | Com Constraints na It. 1 | Sem Constraints na It. 1 |
|---------|--------------------------|--------------------------|
| Qualidade criativa | Baixa (convergencia prematura) | Alta (exploracao livre) |
| Diversidade de opcoes | 1-2 opcoes similares | 5+ opcoes divergentes |
| Risco de "safe" | Alto (IA joga no seguro) | Baixo (IA explora) |
| Resultado final | Copy correta mas rigida | Copy criativa E correta |

---

## Constraints por Fase do Pipeline

### Research (Sessao 1)

Constraints progressivos NAO se aplicam a research. Research e coleta de dados, nao producao criativa.

### Briefing (Sessao 2)

| Fase HELIX | Iteracao | Constraints |
|------------|----------|-------------|
| Fases 1-4 (Avatar, Consciencia) | 1-2 | Apenas dados da VOC + frameworks psicograficos |
| Fases 5-6 (MUP, MUS) | 1-4 | Template de 4 iteracoes para MUP/MUS (ver acima) |
| Fases 7-10 (Oferta, Leads) | 1-2 | Estrutura + VOC + briefing das fases anteriores |

### Production (Sessao 3)

Template de 4 iteracoes aplicado a CADA deliverable (VSL, LP, Criativos, Emails).

### Review (Sessao 4)

Review e Iteracao 4 para TODOS os deliverables simultaneamente. Nao tem progressividade — e validacao completa.

---

## Anti-Patterns

| Anti-Pattern | Por Que E Errado | Correto |
|--------------|------------------|---------|
| Todos os constraints na Iteracao 1 | Copy rigida, convergencia prematura | Constraints progressivos (1→4) |
| Pular Iteracao 1 (ir direto para producao) | Sem exploracao divergente | Sempre comecar com 3-5 abordagens |
| Validar na Iteracao 2 | Mata criatividade antes de estruturar | Validacao formal so na Iteracao 4 |
| Anti-homogeneizacao na Iteracao 1 | IA descarta ideias cruas com potencial | Anti-homogeneizacao na Iteracao 3 |
| Nao fazer Iteracao 4 (entregar na 3) | Copy sem validacao formal | blind_critic + EST + black_validation SEMPRE |
| Reescrever tudo entre iteracoes | Perde o que funcionava | Correcao TARGETED (so o que falhou) |

---

## Checklist de Execucao

### Pre-Producao (antes da Iteracao 1)
- [ ] Briefing HELIX carregado? (helix-complete.md)
- [ ] synthesis.md carregado?
- [ ] DRE da oferta identificada?
- [ ] MUP/MUS definidos e validados?
- [ ] Tipo de deliverable definido?
- [ ] Anti-homogeneizacao do nicho identificada (mas NAO aplicada)?

### Pos-Iteracao 1
- [ ] 3-5 abordagens divergentes geradas?
- [ ] Nenhum constraint de validacao aplicado?
- [ ] Humano escolheu direcao (ou melhor abordagem identificada)?

### Pos-Iteracao 2
- [ ] DRE escalada ate nivel 4-5?
- [ ] VOC quotes reais incluidas?
- [ ] Estrutura do deliverable respeitada?
- [ ] Sinestesia da rotina (nao generica)?

### Pos-Iteracao 3
- [ ] Logo Test aplicado e passando?
- [ ] Specificity >= 8 (Face 1 + Face 2)?
- [ ] Zero cliches do nicho?
- [ ] Zero palavras banidas?
- [ ] Zero hesitacao (linguagem absoluta)?

### Pos-Iteracao 4
- [ ] blind_critic >= 8?
- [ ] emotional_stress_test genericidade >= 8?
- [ ] layered_review (3 camadas)?
- [ ] black_validation >= 8?
- [ ] 5 Lentes: 5/5 fortes?
- [ ] Pronto para entrega ao humano?

---

*v1.0 — Baseado em AIOS Framework (Constraint Progressivo)*
*Integrado com: anti-homogeneization.md, copy-chief.md, tool-usage-matrix.md*
*Ref: aios-principles.md #19*
*Criado: 2026-02-26*
