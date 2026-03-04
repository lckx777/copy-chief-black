# Debugging by Hypothesis Protocol (v1.0)

> Fonte: AIOS Framework (Alan Nicolas) — Principio #14 (10.000+ sessoes)
> Adaptado: Copy Chief BLACK — Copywriting Direct Response
> Principio: Nunca consertar sem confirmar a causa. 3 hipoteses antes de agir.
> Criado: 2026-02-26

---

## REGRA CARDINAL

> **Consertar sem diagnosticar = band-aid. Band-aid acumula. Acumulo = copy Frankenstein.**
> SEMPRE: Observar → Hipotetizar → Verificar → ENTAO corrigir.

---

## PROTOCOLO DE 5 PASSOS

### Passo 1: Declarar Observacao

Formato obrigatorio:
```
OBSERVACAO:
  Esperado: [o que deveria ser]
  Obtido:   [o que foi]
  Delta:    [diferenca especifica]
```

Exemplo:
```
OBSERVACAO:
  Esperado: blind_critic score >= 8
  Obtido:   6.5
  Delta:    -1.5 pontos (18.75% abaixo)
```

### Passo 2: Gerar H0 + 3 Hipoteses (Ordenadas por Probabilidade)

```
HIPOTESES:

H0 (meta-hipotese — verificar PRIMEIRO):
   "O formato/voz/abordagem fundamental está errado?"
   Verificar: Comparar OUTPUT vs EXPECTATIVA do usuario/briefing
   - O deliverable pedido bate com o deliverable gerado?
   - A voz/POV bate com o criativo/referencia?
   - O formato (video vs texto vs email) está correto?
   Se H0 = SIM: PARAR. Nao otimizar na direcao errada.
                Voltar ao briefing/referencia, identificar gap fundamental.

H1 (mais provavel — ~60%): [causa]
   Verificar: [metodo especifico]
   Se confirmada: [acao]

H2 (alternativa — ~25%): [causa]
   Verificar: [metodo especifico]
   Se confirmada: [acao]

H3 (menos provavel — ~15%): [causa]
   Verificar: [metodo especifico]
   Se confirmada: [acao]
```

> **REGRA H0:** Antes de H1-H3, perguntar: "Estou otimizando na direcao certa?"
> Se a resposta for NAO, nenhuma iteracao de H1-H3 vai resolver.
> Exemplo: Microlead com voz errada → aumentar DRE NAO resolve. Mudar voz resolve.

### Passo 3: Verificar H1 Primeiro

Testar a hipotese mais provavel. Se confirmada, corrigir. Se refutada, testar H2.

### Passo 4: Corrigir com Base na Causa Confirmada

NAO corrigir "tudo um pouco". Corrigir A CAUSA ESPECIFICA identificada.

### Passo 5: Re-validar

Rodar a mesma validacao que falhou para confirmar que a correcao resolveu.

---

## CENARIOS COMUNS DE COPY

### Cenario 1: blind_critic Score Baixo (< 8)

```
OBSERVACAO:
  Esperado: blind_critic >= 8
  Obtido:   [score]
  Delta:    [diferenca]

HIPOTESES:

H1 (~60%): Copy generica — falta especificidade (Logo Test falharia)
   Verificar: Rodar Logo Test mental. Concorrente usaria sem alterar?
   Se confirmada: Aplicar Specificity Score checklist (Face 1 + Face 2)
                  Adicionar: nomes, numeros nao-redondos, cenas sensoriais

H2 (~25%): Desalinhamento com briefing — copy nao reflete MUP/MUS
   Verificar: Comparar copy com mecanismo-unico.yaml e fases HELIX 5-6
   Se confirmada: Reescrever alinhando com MUP/MUS do briefing
                  Garantir que Sexy Cause e Gimmick Name aparecem

H3 (~15%): Estrutura fraca — falta de progressao persuasiva
   Verificar: Mapear fluxo RMBC na copy. Ha R→M→B→C claro?
   Se confirmada: Reestruturar seguindo template adequado
                  Verificar proporcoes por secao
```

### Cenario 2: emotional_stress_test Score Baixo (< 8)

```
OBSERVACAO:
  Esperado: EST genericidade >= 8
  Obtido:   [score]
  Delta:    [diferenca]

HIPOTESES:

H1 (~60%): DRE ausente ou superficial — emocao nao foi explorada
   Verificar: Buscar DRE na copy. Esta no nivel 1-2 ou 4-5?
   Se confirmada: Adicionar escalada emocional nivel 4-5
                  Usar quotes VOC de alta intensidade
                  Incluir cena vivida (Face 2 da Especificidade)

H2 (~25%): Copy informativa, nao emocional — excesso de dados, falta de narrativa
   Verificar: Contar ratio dados:narrativa. Mais de 70% dados?
   Se confirmada: Adicionar cenas sensoriais entre blocos de dados
                  "Mostrar, nao contar" — transformar afirmacoes em cenas

H3 (~15%): Avatar errado — DRE nao corresponde ao publico real
   Verificar: Comparar DRE usada com research/avatar/summary.md
   Se confirmada: Reler VOC summary. Identificar DRE real do avatar.
                  Reescrever com DRE correta e escalada adequada
```

### Cenario 3: BC Alto + EST Baixo (Pattern 37.5%)

```
OBSERVACAO:
  Esperado: BC >= 8 E EST >= 8
  Obtido:   BC = [alto] / EST = [baixo]
  Delta:    Copy tecnicamente boa mas emocionalmente fraca
  Nota:     Este pattern ocorre em ~37.5% dos casos

HIPOTESES:

H1 (~50%): Copy "correta" mas sem alma — seguiu template sem adicionar DRE
   Verificar: Template esta preenchido corretamente? Sim.
              Mas onde esta a EMOCAO? Buscar cenas vividas.
   Se confirmada: Manter estrutura (BC ja e alto)
                  ADICIONAR entre blocos:
                  - Cena vivida do avatar (Face 2)
                  - Quote VOC nivel 4-5
                  - Escalada emocional progressiva
                  NAO mexer na estrutura — so adicionar camada emocional

H2 (~30%): Especificidade so Face 1 (dados) sem Face 2 (narrativa)
   Verificar: Tem numeros especificos? SIM. Tem cenas vividas? NAO.
   Se confirmada: Adicionar Face 2:
                  - Cena de Filme (momento especifico)
                  - Reacao de terceiros ("O medico olhou e disse...")
                  - Detalhes sensoriais ("Acordou suando frio")

H3 (~20%): DRE no nivel errado — usando medo nivel 2 quando avatar esta no nivel 4
   Verificar: Qual nivel de DRE na copy? Qual nivel na VOC?
   Se confirmada: Escalar DRE para nivel 4-5
                  Nivel 4 (Relacional): "Parceira vai encontrar outro"
                  Nivel 5 (Identidade): "Morrer sendo lembrado como..."
```

### Cenario 4: black_validation Falhando (< 8)

```
OBSERVACAO:
  Esperado: black_validation >= 8
  Obtido:   [score]
  Delta:    [diferenca]
  Nota:     black_validation avalia MULTIPLAS dimensoes

HIPOTESES:

H1 (~40%): Uma dimensao especifica puxou score para baixo
   Verificar: Identificar quais dimensoes falharam no report da BV
   Se confirmada: Tratar CADA dimensao que falhou individualmente:
                  - Especificidade baixa → Specificity Score checklist
                  - Emocao fraca → DRE + escalada
                  - Estrutura ruim → Reestruturar RMBC
                  - Credibilidade baixa → Adicionar provas

H2 (~35%): Deliverable incompleto — faltam secoes ou blocos
   Verificar: Comparar com checklist do deliverable (tool-usage-matrix.md)
   Se confirmada: Completar blocos faltantes
                  Cada bloco novo deve passar por blind_critic individual

H3 (~25%): Problema cascateado — niveis inferiores fracos
   Verificar: Decomposicao atomica (ref: atomic-design-copy.md):
              Pagina → Organismo → Molecula → Atomo → Token
   Se confirmada: Identificar QUAL nivel esta fraco
                  Corrigir de baixo para cima (tokens primeiro)
                  Re-compor niveis superiores
```

### Cenario 5: Logo Test Falhando

```
OBSERVACAO:
  Esperado: Logo Test PASS (concorrente NAO usaria)
  Obtido:   Logo Test FAIL (concorrente USARIA sem alterar)
  Delta:    Copy nao e proprietaria

HIPOTESES:

H1 (~50%): Falta de Mecanismo Unico na copy — MUP/MUS nao aparecem
   Verificar: Buscar Sexy Cause, Gimmick Name, Authority Hook na copy
   Se confirmada: Inserir elementos do mecanismo-unico.yaml:
                  - Sexy Cause no problema
                  - Gimmick Name na solucao
                  - Authority Hook na credibilidade
                  - Origin Story na narrativa

H2 (~30%): Cliches do nicho — usando linguagem saturada
   Verificar: Checar contra lista de cliches proibidos (anti-homogeneization.md)
   Se confirmada: Substituir CADA cliche por linguagem proprietaria
                  Usar vocabulario da VOC (nao inventar)
                  Verificar palavras banidas

H3 (~20%): Falta de dados especificos — copy poderia ser de qualquer oferta
   Verificar: Specificity Score (Face 1: Dados)
              Contar: nomes, numeros, localizacoes, datas
   Se confirmada: Adicionar pelo menos:
                  - 3 numeros nao-redondos
                  - 2 nomes proprios
                  - 1 localizacao especifica
                  - 1 data precisa
```

### Cenario 6: Specificity Score < 8

```
OBSERVACAO:
  Esperado: Specificity Score >= 8
  Obtido:   [score]
  Delta:    [diferenca]

HIPOTESES:

H1 (~45%): Face 1 (Dados) insuficiente — poucos elementos especificos
   Verificar: Checar 8 itens da Face 1:
              Nome, Idade, Localizacao, Profissao, Numero, Data, Resultado, Sensorial
   Se confirmada: Score Face 1 deve ser >= 6/8
                  Adicionar itens faltantes usando VOC + Research

H2 (~35%): Face 2 (Narrativa) insuficiente — falta cena vivida
   Verificar: Checar 5 dimensoes da Face 2:
              Dados Precisos, Cena Vivida, Reacao Terceiros, Contexto Inesperado, Detalhes Sensoriais
   Se confirmada: Score Face 2 deve ser >= 3/5
                  Adicionar pelo menos:
                  - 1 cena de filme (momento especifico)
                  - 1 reacao de terceiro ("O medico disse...")
                  - 1 detalhe sensorial ("Suor frio as 3h")

H3 (~20%): AMBAS as Faces fracas — copy superficial em todos os aspectos
   Verificar: Se Face 1 < 4 E Face 2 < 2
   Se confirmada: Copy precisa de rewrite significativo, nao ajuste
                  Voltar a VOC summary, extrair tokens novos
                  Reconstruir de baixo para cima (Atomic Design)
```

---

## REGRAS DE DEBUG

### Regra 1: Nunca Consertar Sem Diagnosticar

| Errado | Correto |
|--------|---------|
| Score 6.5 → "Vou melhorar a copy" | Score 6.5 → "H1: especificidade. Verifico com Logo Test." |
| "Ta fraco" → reescreve tudo | "Ta fraco" → H1: DRE? H2: Narrativa? H3: Avatar? |
| "Nao passou" → tenta de novo | "Nao passou" → Qual dimensao? Qual hipotese? |

### Regra 2: Uma Variavel por Vez

Ao testar correcao, mudar UMA coisa:
- Se H1 e especificidade → so adicionar especificidade, nao mudar estrutura
- Se H2 e DRE → so adicionar emocao, nao mudar dados
- Se H3 e estrutura → so reestruturar, nao reescrever conteudo

**Por que:** Mudar tudo de uma vez impede saber O QUE resolveu.

### Regra 3: Re-validar Apos Correcao

SEMPRE rodar a mesma ferramenta de validacao apos correcao:

| Falha Original | Correcao | Re-validacao |
|----------------|----------|-------------|
| blind_critic < 8 | [correcao aplicada] | blind_critic novamente |
| EST < 8 | [correcao aplicada] | EST novamente |
| black_validation < 8 | [correcao aplicada] | black_validation novamente |
| Logo Test FAIL | [correcao aplicada] | Logo Test novamente |

### Regra 4: Documentar Causa Raiz

Apos resolver, registrar em findings.md:

```markdown
## Debug: [Data] - [Deliverable]

### Problema
[Observacao: esperado vs obtido]

### Hipotese Confirmada
[Qual das 3 hipoteses era correta]

### Correcao Aplicada
[O que foi feito]

### Resultado
[Score apos correcao]

### Aprendizado
[O que fazer diferente na proxima vez para evitar]
```

### Regra 5: Decomposicao Atomica para Falhas Persistentes

Se a correcao NAO resolveu apos 2 tentativas:

```
FALHA PERSISTENTE
        |
        v
Decomposicao Atomica (ref: atomic-design-copy.md):

Nivel 6 (Pagina) falhou
  → Qual Nivel 5 (Template) esta errado?
    → Qual Nivel 4 (Organismo) esta fraco?
      → Qual Nivel 3 (Molecula) nao funciona?
        → Qual Nivel 2 (Atomo) esta generico?
          → Qual Nivel 1 (Token) esta inventado?
```

**A causa raiz de falhas persistentes quase sempre esta nos niveis 1-2 (tokens e atomos).**

---

## PADROES RECORRENTES

### Padrao A: "Copy Boa mas Generica"

| Indicador | blind_critic >= 8, EST < 8, Logo Test FAIL |
|-----------|---------------------------------------------|
| Causa Usual | Seguiu template sem personalizar. Falta Face 2 da Especificidade. |
| Fix | Adicionar cenas vividas, DRE nivel 4-5, linguagem VOC real |

### Padrao B: "Copy Emocional mas Desestruturada"

| Indicador | blind_critic < 8, EST >= 8 |
|-----------|----------------------------|
| Causa Usual | Escreveu "do coracao" sem seguir RMBC. Emocao sem direcionamento. |
| Fix | Reestruturar seguindo template. Manter emocao, adicionar progressao logica. |

### Padrao C: "Copy Perfeita que Nao Converte"

| Indicador | Todos os scores altos, mas nao gera acao |
|-----------|------------------------------------------|
| Causa Usual | Falta CTA forte, falta urgencia, falta reversao de risco. |
| Fix | Verificar bloco de oferta, garantia, urgencia. Testar CTAs diferentes. |

### Padrao D: "Score Oscilante" (Sobe e Desce)

| Indicador | Score varia +/- 2 pontos entre revisoes |
|-----------|------------------------------------------|
| Causa Usual | Correcao de uma dimensao prejudica outra. Mudando muitas variaveis. |
| Fix | Uma variavel por vez (Regra 2). Identificar trade-off entre dimensoes. |

### Padrao E: "Funciona em Um Deliverable, Falha em Outro"

| Indicador | VSL score alto, LP score baixo (ou vice-versa) |
|-----------|--------------------------------------------------|
| Causa Usual | Template diferente exige adaptacao, nao copy-paste. |
| Fix | Recompor usando Atomic Design. Atomos reutilizaveis, organismos nao. |

---

## INTEGRACAO COM OUTROS PROTOCOLOS

| Situacao | Protocolo Complementar |
|----------|------------------------|
| Score falhou pela 1a vez | Este protocolo (3 hipoteses) |
| Score falhou pela 3a vez | BSSF (5 solucoes estruturais). Ref: bssf-decision.md |
| 3 scores consecutivos ±0.3 | Reflection Agent (LOOP). Ref: agents/reflection/AGENT.md |
| Copy sem keywords MUP/MUS | Reflection Agent (DRIFT). Ref: agents/reflection/AGENT.md |
| Nao sabe onde o problema esta | Exploracao Estruturada Pass 3. Ref: structured-exploration.md |
| Problema esta nos tokens | VOC Research Protocol. Ref: voc-research.md |
| Problema esta na estrutura | Atomic Design decomposicao. Ref: atomic-design-copy.md |
| Usuario disse "generico" | Signal Translation. Ref: signal-translation.md |

---

## CHECKLIST RAPIDO

Antes de corrigir qualquer falha de score:

- [ ] Declarei OBSERVACAO (esperado vs obtido)?
- [ ] Gerei 3 hipoteses ordenadas por probabilidade?
- [ ] Verifiquei H1 antes de tentar H2?
- [ ] Correcao muda UMA variavel?
- [ ] Re-validacao esta planejada?
- [ ] Causa raiz sera documentada em findings.md?

---

*v1.0 — Adaptado de AIOS Framework (Alan Nicolas, Principio #14)*
*Contexto: Copy Chief BLACK — Copywriting Direct Response*
*6 cenarios comuns + 5 padroes recorrentes*
*Ref: atomic-design-copy.md (decomposicao), bssf-decision.md (falhas persistentes)*
*Criado: 2026-02-26*
