---
template_name: "story-vsl-capitulo"
template_version: "1.0.0"
template_type: "story"
description: "Story template para producao de capitulos individuais de VSL"
phase: "production"
deliverable_type: "vsl"
output_format: "markdown"
---

# Story: VSL Capitulo [##] ([TIPO]) — [OFFER_NAME]

> Template: story-vsl-capitulo.md v1.0
> Criado: [DATA]
> Oferta: [NICHO]/[OFERTA]
> Fase: PRODUCTION
> Ref: rmbc-ii-workflow.md (estrutura RMBC II de Stefan Georgi)
> MCP: write_chapter OBRIGATORIO para cada capitulo

---

## Status
- [ ] Story criada
- [ ] Capitulo anterior revisado (continuidade)
- [ ] write_chapter (MCP) executado
- [ ] Primeira versao completa
- [ ] blind_critic >= 8
- [ ] Transicoes in/out verificadas
- [ ] Retencao checkpoint atingida
- [ ] Integrado na VSL completa
- [ ] Humano aprovou

---

## Identificacao do Capitulo

| Campo | Valor |
|-------|-------|
| **Capitulo #** | [01-06] |
| **Tipo** | [ver tabela abaixo] |
| **Objetivo do Capitulo** | [1 frase] |
| **Duracao Target** | [minutos:segundos] |
| **Retencao Target** | [X% dos que iniciaram] |
| **Posicao no Arco Emocional** | [ver diagrama abaixo] |

### Mapa dos 6 Capitulos (Baseado em RMBC II)

| # | Tipo | Objetivo Core | Elemento HELIX | Duracao Sugerida |
|---|------|---------------|----------------|------------------|
| 01 | Hook/Lead | Parar, criar loop aberto | NUUPPECC Lead + DRE | 0:30-1:30 |
| 02 | Problema/Background | Agitar dor, externalizar culpa | DRE + Vilao + Story | 2:00-4:00 |
| 03 | Descoberta/Mecanismo | Revelar MUP, reframe | MUP (Sexy Cause) | 2:00-3:00 |
| 04 | Solucao/Produto | Apresentar MUS, produto | MUS + Ingrediente Hero | 2:00-3:00 |
| 05 | Oferta/Stack | Stack de valor, ancoragem | Oferta + Bonus | 1:30-2:30 |
| 06 | CTA/Close | Fechar com urgencia | Garantia + Consequencia | 1:00-2:00 |

### Regra 3-7-18 (Georgi)

| Formato | Duracao Total | Uso |
|---------|---------------|-----|
| Curto | ~3 min | Social ads, retargeting |
| Medio | ~7 min | Maioria dos casos |
| Longo | ~18 min | Ofertas complexas, high-ticket |

**Formato desta VSL:** [CURTO/MEDIO/LONGO]
**Duracao Total Target:** [X minutos]

---

## Arco Emocional da VSL

```
Emocao
  ^
  |         ESPERANCA
  |        /         \
  |       /    5      \  6
  |      /   Oferta    \ Close
  |   3 /               \
  |  Descoberta          ──> ACAO
  |  (virada)
  |
  |  1
  | Hook ──── 2 ──────┐
  |         Problema   │
  |                    v
  |              DESESPERO
  |              (ponto mais baixo)
  +──────────────────────────────> Tempo
```

**Posicao DESTE capitulo no arco:** [descrever]
**Emocao DOMINANTE neste capitulo:** [qual]
**Nivel de intensidade:** [1-10, onde 10 = pico emocional]

---

## Contexto HELIX (Especifico para Este Capitulo)

### MUP
> Fonte: mecanismo-unico.yaml

- **Sexy Cause:** [nome]
- **Problema Fundamental:** [descricao]
- **Usado neste capitulo?** [SIM (caps 02-03) / REFERENCIADO / NAO]

### MUS
> Fonte: mecanismo-unico.yaml

- **Gimmick Name:** [nome]
- **Ingrediente Hero:** [componente]
- **Authority Hook:** [validacao]
- **Origin Story:** [resumo]
- **Usado neste capitulo?** [SIM (caps 03-04) / REFERENCIADO / NAO]

### DRE
- **Emocao:** [qual]
- **Nivel de Escalada NESTE capitulo:** [1-5]
- **Progressao:** Cap anterior = nivel [X] → Este cap = nivel [Y] → Proximo cap = nivel [Z]

### One Belief
"[crenca unica]"
**Momento de introducao:** [em qual capitulo o One Belief e plantado vs colhido]

### Promessa Central
"[promessa]"
**Usada neste capitulo?** [SIM/NAO — se SIM, como]

### Vilao + Solucoes Falsas
- **Vilao:** [quem/o que]
- **Usado neste capitulo?** [SIM (cap 02) / REFERENCIADO / NAO]
- **Solucoes Falsas descartadas neste capitulo?** [listar se aplicavel]

---

## Retencao Checkpoints

### Metricas Target por Capitulo

| Capitulo | Checkpoint | Retencao Target | Tecnica de Retencao |
|----------|------------|-----------------|---------------------|
| 01 (Hook) | 0:03 — Scroll parou | 90%+ | Pattern interrupt visual/verbal |
| 01 (Hook) | 0:30 — Loop aberto | 75%+ | Promessa + curiosidade |
| 02 (Problema) | 2:00 — Identificacao | 65%+ | "Isso sou eu" + sinestesia |
| 03 (Descoberta) | 4:00 — Aha moment | 55%+ | Reframe + evidencia |
| 04 (Solucao) | 6:00 — Credibilidade | 45%+ | Authority + prova |
| 05 (Oferta) | 8:00 — Valor percebido | 40%+ | Stack + ancoragem |
| 06 (CTA) | Final — Acao | 35%+ | Urgencia + consequencia |

**Checkpoint DESTE capitulo:**
- **Timestamp alvo:** [mm:ss]
- **Retencao target:** [X%]
- **Tecnica principal:** [qual tecnica de retencao usar]
- **Indicador de falha:** [se retencao cair abaixo de X%, o que revisar]

---

## Transition Hooks (Entrada/Saida)

### Hook de Entrada (Como Este Capitulo Comeca)

**Capitulo anterior terminou com:**
> "[ultima frase ou ideia do capitulo anterior]"

**Loop aberto pendente do capitulo anterior:**
> "[se houver — qual]"

**Primeira frase deste capitulo deve:**
- [Conectar com / Resolver / Escalar o que veio antes]
- **Tecnica:** [continuidade direta / pattern interrupt / revelacao / escalada]

**Primeiras palavras sugeridas:**
```
[Rascunho da primeira frase de transicao]
```

### Hook de Saida (Como Este Capitulo Termina)

**Proximo capitulo precisa receber:**
- [Que estado emocional / informacao / loop aberto]

**Ultima frase deste capitulo deve:**
- [Criar ponte / Abrir loop / Escalar emocao]
- **Tecnica:** [cliffhanger / promessa / curiosidade / revelacao parcial]

**Ultimas palavras sugeridas:**
```
[Rascunho da ultima frase de transicao]
```

---

## VOC Quotes (Mapeadas para Este Capitulo)

### Quotes Primarias

| # | Quote | Emocao | Nivel | Uso Neste Capitulo |
|---|-------|--------|-------|-------------------|
| 1 | "[quote]" — @user | [emocao] | [1-5] | [linguagem / agitacao / prova / voz do avatar] |
| 2 | "[quote]" — @user | [emocao] | [1-5] | [uso] |
| 3 | "[quote]" — @user | [emocao] | [1-5] | [uso] |

### Mapeamento Capitulo-Quote (Referencia)

| Tipo de Capitulo | Quotes Ideais |
|------------------|---------------|
| 01 (Hook) | Dor intensa nivel 4-5, curiosidade, "ja tentei tudo" |
| 02 (Problema) | Sinestesia, vergonha, medo, frustacao detalhada |
| 03 (Descoberta) | Surpresa, "nao sabia disso", raiva ("me enganaram") |
| 04 (Solucao) | Esperanca, desejo, "quero isso", resultados |
| 05 (Oferta) | Valor, "quanto custa", objecoes de preco |
| 06 (CTA) | Urgencia, medo de perder, consequencia de nao agir |

---

## Patterns Aplicaveis

### Patterns para ESTE Capitulo
1. **[pattern]:** [como aplicar]
2. **[pattern]:** [como aplicar]

### Anti-Patterns
1. **[anti_pattern]:** [evitar porque]
2. **[anti_pattern]:** [evitar porque]

### Cliches Proibidos (Nicho: [NICHO])
| Proibido | Substituir Por |
|----------|---------------|
| [cliche] | [alternativa especifica] |
| [cliche] | [alternativa especifica] |

---

## write_chapter MCP Integration

### Pre-Chamada
- [ ] Contexto HELIX preenchido nesta story
- [ ] VOC quotes selecionadas
- [ ] Transicoes definidas (in/out)
- [ ] Capitulo anterior finalizado e aprovado

### Parametros para write_chapter

```
capitulo: [numero]
tipo: [hook/problema/descoberta/solucao/oferta/cta]
contexto_helix: [resumo do MUP+MUS+DRE para este capitulo]
voc_quotes: [quotes selecionadas]
tom: [autoridade/empatico/urgente/casual]
duracao_target: [segundos]
transicao_entrada: [frase de conexao com capitulo anterior]
transicao_saida: [tipo de hook para proximo capitulo]
```

### Pos-Chamada
- [ ] Output salvo em `production/vsl/capitulo-[##]-[tipo].md`
- [ ] Transicoes verificadas
- [ ] Duracao estimada condiz com target

---

## Acceptance Criteria (Por Capitulo)

### Cross-Capitulo (Todos)
- [ ] Especificidade Score >= 8
- [ ] Zero palavras banidas
- [ ] Linguagem da VOC
- [ ] Transicao de entrada fluida
- [ ] Transicao de saida cria ponte
- [ ] Duracao dentro do target (+/- 15%)
- [ ] Tom consistente com capitulos adjacentes

### Cap 01 (Hook/Lead)
- [ ] Primeiros 3 segundos param scroll (pattern interrupt)
- [ ] Loop aberto criado nos primeiros 30 segundos
- [ ] Promessa especifica (nao generica)
- [ ] Qualificador presente ("Se voce [situacao]...")
- [ ] Ceticismo brevemente endererecado
- [ ] Credibilidade mencionada (nao detalhada)
- [ ] NUUPPECC Lead identificavel

### Cap 02 (Problema/Background)
- [ ] Sinestesia emocional presente (cena vivida)
- [ ] DRE escalada para nivel 3-4
- [ ] Vilao externo revelado
- [ ] Solucoes falsas descartadas
- [ ] "Nao era culpa sua" implicito ou explicito
- [ ] Story do spokesperson (se aplicavel)

### Cap 03 (Descoberta/Mecanismo)
- [ ] MUP nomeado (Sexy Cause)
- [ ] Reframe do problema claro ("aha moment")
- [ ] Evidencia/prova do mecanismo
- [ ] Mudanca de paradigma evidente
- [ ] Emocao vira de desespero para esperanca

### Cap 04 (Solucao/Produto)
- [ ] MUS nomeado (Gimmick Name)
- [ ] Ingrediente Hero apresentado
- [ ] Authority Hook presente
- [ ] Origin Story contada
- [ ] Conexao MUP→MUS logica ("se X e o problema, Y e a solucao")
- [ ] Produto revelado como consequencia natural

### Cap 05 (Oferta/Stack)
- [ ] Stack com minimo 5 itens
- [ ] Valor individual para cada item
- [ ] Ancoragem de preco efetiva
- [ ] Bonus tem nomes proprios
- [ ] Cada item conecta com um beneficio/dor

### Cap 06 (CTA/Close)
- [ ] CTA claro e repetido (minimo 2x)
- [ ] Garantia explicita
- [ ] Urgencia real (nao fabricada)
- [ ] Consequencia de nao agir (DRE nivel 5)
- [ ] "Picture" emocional da vida com o produto
- [ ] Contraste: vida sem vs vida com

---

## Tasks

### Pre-Producao
- [ ] Ler story do capitulo anterior (continuidade)
- [ ] Ler CONTEXT.md + mecanismo-unico.yaml
- [ ] Carregar swipes de VSL do nicho (capitulo equivalente)
- [ ] Preencher contexto HELIX e VOC nesta story
- [ ] Definir transicoes de entrada e saida

### Producao
- [ ] Executar write_chapter (MCP) com parametros definidos
- [ ] Revisar output vs acceptance criteria
- [ ] Verificar transicao de entrada
- [ ] Verificar transicao de saida
- [ ] Output em: `production/vsl/capitulo-[##]-[tipo].md`

### Pos-Producao (Por Capitulo)
- [ ] blind_critic (copy_type: "body") — score: ___
- [ ] Verificar retencao checkpoint
- [ ] Verificar acceptance criteria do tipo

### Integracao (Apos TODOS os Capitulos)
- [ ] emotional_stress_test na VSL completa — score: ___
- [ ] layered_review (3 camadas) na VSL completa
- [ ] black_validation na VSL completa — score: ___
- [ ] Arco emocional coerente do cap 01 ao 06
- [ ] Duracao total dentro do target
- [ ] Lead reescrito por ULTIMO (Regra Georgi)

---

## Dev Notes

### Decisoes de Copy (Este Capitulo)
[Registrar: por que este angulo, este tom, estas palavras.
Ex: "Usei angulo conspiricao no cap 02 porque ads-library-spy mostra que 4 dos TOP 5 escalados usam esse angulo neste nicho"]

### Insights de Sessoes Anteriores
[Contexto preservado de sessoes passadas]

### Versoes
| # | Data | Score BC | Duracao | Mudanca Principal |
|---|------|----------|---------|-------------------|
| 1 | | | | Primeira versao |
| 2 | | | | [mudanca] |

---

## QA Results (Por Capitulo)

### blind_critic
- **Score:** ___/10
- **Feedback:** [resumo]
- **Acoes:** [o que mudou]

---

## Rastreabilidade

| Campo | Valor |
|-------|-------|
| **Capitulo** | #[XX] de 06 |
| **Duracao** | [mm:ss] (target: [mm:ss]) |
| **Arquivo de output** | production/vsl/capitulo-[##]-[tipo].md |
| **VSL completa em** | production/vsl/[oferta]-vsl-completa.md |
| **Story do cap anterior** | story-vsl-capitulo-[##].md |
| **Story do proximo cap** | story-vsl-capitulo-[##].md |
| **write_chapter usado** | [SIM/NAO] |
| **Sessoes utilizadas** | [numero] |

---

*story-vsl-capitulo.md v1.0 — Story-Driven VSL Production (por capitulo)*
*6 capitulos com arco emocional, retencao checkpoints e write_chapter MCP*
*Ref: rmbc-ii-workflow.md para estrutura RMBC II*
