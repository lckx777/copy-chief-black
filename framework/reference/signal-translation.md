# Signal Translation & Irritation Prevention (v2.0)

> Fonte: AIOS Framework (Alan Nicolas) — Principios #21 e #22 (10.000+ sessoes)
> Adaptado: Copy Chief BLACK — Copywriting Direct Response
> Criado: 2026-02-26
> Substitui: signal-translation.md v1.0

---

## REGRA CARDINAL

> **O usuario diz uma coisa, significa outra. Traduzir ANTES de agir.**
> Interpretar literalmente = erro mais comum. Mapear sinal → significado → acao.

---

## PARTE I: TABELA DE TRADUCAO DE SINAIS (20 Sinais)

### Sinais Gerais de Workflow

| # | Sinal do Usuario | Significado Real | Acao Correta |
|---|-------------------|-----------------|--------------|
| 1 | Repetiu instrucao 2x | Claude nao entendeu ou nao obedeceu | PARE. Releia pedido ORIGINAL. Faca EXATAMENTE o que foi pedido. NAO justifique. (Regra 2x) |
| 2 | "Quando fica pronto?" | Impaciencia — nao ve progresso | Reportar progresso com % claro: "3/6 capitulos prontos, proximo: Capitulo 4 (Solucao)" |
| 3 | "Ja temos isso" | Nao verificou existente antes de criar | Rodar Discovery (ls, find, glob) ANTES de qualquer criacao. Apresentar findings. |
| 4 | Silencio apos entrega | Avaliando OU insatisfeito | Perguntar: "Atende o objetivo ou quer ajuste em algum ponto?" |
| 5 | "OK" (seco, sem elaboracao) | Aprovacao minima, nao entusiasmado | Seguir para proxima etapa. NAO interpretar como "excelente". |
| 6 | "Perfeito!" (entusiastico) | Genuinamente satisfeito | Registrar o que funcionou para replicar o padrao. |
| 7 | "Continua" ou "Segue" | Quer que avance sem pausa | NAO parar para explicar. NAO pedir confirmacao. Executar proximo passo. |
| 8 | "Para" ou "Espera" | Algo errado, precisa repensar | PARAR imediatamente. Aguardar nova instrucao. NAO continuar "so mais um passo". |
| 9 | Mandou link/arquivo | Quer que LEIA | Ler ANTES de responder. NAO pedir resumo do que contem. |
| 10 | Tom mais curto | Irritacao crescendo | Simplificar. Ir direto ao ponto. Zero justificativa. |

### Sinais Especificos de Copy

| # | Sinal do Usuario | Significado Real | Acao Correta |
|---|-------------------|-----------------|--------------|
| 11 | "Ta generico" | Logo Test FALHOU. Concorrente usaria. | Aplicar Specificity Score >= 8 (Face 1: Dados + Face 2: Narrativa). Ref: anti-homogeneization.md |
| 12 | "Fraco" | Impacto emocional insuficiente | Verificar: DRE presente? Escalada emocional nivel 4-5? Cena vivida? EST score? |
| 13 | "Nao e isso" | Desalinhamento com briefing/visao | PARAR producao. Reler CONTEXT.md + synthesis.md. Perguntar: "O que especificamente nao esta alinhado?" |
| 14 | "Pode melhorar?" | Quer revisao, nao rewrite | Rodar layered_review (3 camadas). NAO refazer do zero. |
| 15 | "Mais agressivo" | Quer escalada emocional maior | Subir nivel de DRE (4→5). Adicionar urgencia. Amplificar consequencias. |
| 16 | "Mais suave" | Tom esta assustando, nao persuadindo | Reduzir nivel de DRE (5→3). Manter emocao, reduzir intensidade. |
| 17 | "Parece IA" | IA-speak detectado. Palavras banidas usadas. | Checar lista de palavras banidas (anti-homogeneization.md). Substituir CADA uma por linguagem VOC. |
| 18 | "Falta prova" | Afirmacoes sem evidencia | Adicionar: numeros especificos, nomes, estudo, depoimento, mecanismo cientifico. |
| 19 | "Ta comprido" | Copy arrastada, sem edicao | Cortar: repeticoes, transicoes fracas, paragrafos que nao avancem persuasao. |
| 20 | "Usa VOC" | Copy nao soa como avatar | Voltar a research/voc/summary.md. Extrair expressoes EXATAS. Substituir linguagem propria por linguagem do avatar. |

### Sinais de Score/Validacao

| # | Sinal | Significado | Acao |
|---|-------|-------------|------|
| 21 | blind_critic retornou < 8 | Copy nao atingiu threshold | Debugging por Hipotese (ref: debugging-hypothesis.md). NAO refazer as cegas. |
| 22 | EST retornou < 8 | Copy generica ou desconectada emocionalmente | Verificar DRE, especificidade, Logo Test. Tratar como "ta generico". |
| 23 | BC alto + EST baixo | Copy tecnicamente boa mas emocionalmente fraca | Pattern 37.5% — adicionar DRE visceral, cenas vividas, escalada nivel 4-5. |
| 24 | black_validation < 8 | Deliverable completo abaixo do padrao | Identificar QUAIS dimensoes falharam. Tratar cada uma individualmente. |

---

## PARTE II: GATILHOS DE IRRITACAO (12 Triggers)

### Tabela de Prevencao

| # | Gatilho | Causa Raiz | Prevencao | Se Ja Aconteceu |
|---|---------|-----------|-----------|-----------------|
| 1 | **Copy generica** | Nao usou VOC, nao aplicou anti-homogeneizacao | Logo Test + Specificity >= 8 ANTES de entregar | Refazer com quotes VOC + Specificity checklist |
| 2 | **Score baixo sem explicacao** | Entregou numero sem contexto | Sempre: "Score X porque [dimensao Y falhou]" | Rodar Debugging por Hipotese, explicar causa |
| 3 | **Producao sem VOC** | Pulou research, produziu do nada | Hooks de enforcement bloqueiam automaticamente | Pausar producao, voltar a research |
| 4 | **Deliverable incompleto** | Nao seguiu checklist do tipo | Checklist obrigatorio por deliverable (tool-usage-matrix.md) | Completar itens faltantes |
| 5 | **Feature nao solicitada** | Over-engineering, "bonus" | Regra #12 AIOS (So o que Foi Pedido) | Remover feature extra, pedir desculpa pela tangente |
| 6 | **Copy no terminal** | Output em chat em vez de arquivo | SEMPRE Write tool para production/ | Mover para arquivo imediatamente |
| 7 | **Explicacao excessiva** | Claude justifica em vez de executar | Executar primeiro, explicar BREVEMENTE depois | Cortar explicacao, mostrar resultado |
| 8 | **Pergunta ja respondida** | Nao leu contexto disponivel | Ler CONTEXT.md + synthesis.md ANTES de perguntar | Pedir desculpa, ler agora |
| 9 | **Tangente academica** | Explicou teoria em vez de produzir | Producao > Teoria. Fazer, nao ensinar. | Voltar ao deliverable pedido |
| 10 | **Repetir erro corrigido** | Nao aprendeu com feedback anterior | Registrar correcao em findings.md | Reler feedback anterior, aplicar |
| 11 | **Ignorar restricao explicita** | Nao seguiu regra do CLAUDE.md ou rules/ | Rules sao OBRIGATORIAS, nao sugestoes | Aplicar restricao imediatamente |
| 12 | **"Quer que eu continue?"** | Pedir confirmacao desnecessaria apos aprovacao | Se usuario aprovou, CONTINUAR silenciosamente | Continuar executando |

---

## PARTE III: ARVORE DE DECISAO PARA SINAIS AMBIGUOS

### Quando o Sinal Nao e Claro

```
SINAL AMBIGUO RECEBIDO
        |
        v
1. E a SEGUNDA vez que o usuario diz algo similar?
   |
   SIM → Regra 2x: PARE, faca EXATAMENTE o pedido
   |
   NAO → Continua ↓
        |
        v
2. O sinal e sobre QUALIDADE da copy?
   |
   SIM → Diagnosticar:
   |     - "generico/fraco/IA" → anti-homogeneizacao + VOC
   |     - "nao e isso" → reler briefing
   |     - "pode melhorar" → layered_review
   |
   NAO → Continua ↓
        |
        v
3. O sinal e sobre PROCESSO/VELOCIDADE?
   |
   SIM → Diagnosticar:
   |     - "quando fica pronto" → reportar % progresso
   |     - "continua/segue" → executar sem pausar
   |     - "para/espera" → parar imediatamente
   |
   NAO → Continua ↓
        |
        v
4. O sinal e sobre ESCOPO?
   |
   SIM → Diagnosticar:
   |     - "tambem preciso de X" → confirmar escopo expandido
   |     - "so quero X" → reduzir escopo
   |     - "ja temos isso" → verificar existente
   |
   NAO → Continua ↓
        |
        v
5. GENUINAMENTE AMBIGUO
   → Perguntar UMA pergunta especifica:
     "Entendi [interpretacao]. E isso ou prefere [alternativa]?"
   → NAO fazer 3 perguntas. UMA.
```

### Regras para Perguntar

| Situacao | Perguntar? | Como |
|----------|-----------|------|
| Sinal claro | NAO — executar | - |
| Sinal ambiguo, baixo risco | NAO — melhor interpretacao | Agir + "Se nao for isso, me diga" |
| Sinal ambiguo, alto risco | SIM — 1 pergunta | "Entendi X. Confirma?" |
| Sinal contradiz briefing | SIM — confirmar intencao | "Briefing diz Y, mas voce pediu X. Qual prevalece?" |

**Anti-Pattern:** Fazer 3+ perguntas antes de agir = paralisia. O usuario quer RESULTADO, nao questionario.

---

## PARTE IV: PADROES DE FEEDBACK EM SESSAO

### Feedback Loop Positivo (Sinal: Tudo Indo Bem)

```
Usuario aprova deliverable
        |
        v
Registrar O QUE funcionou:
- Qual angulo?
- Qual nivel de DRE?
- Qual estrutura?
- Quanta VOC usou?
        |
        v
Replicar padrao nos proximos deliverables
```

### Feedback Loop Negativo (Sinal: Algo Errado)

```
Usuario rejeita ou critica
        |
        v
1. NAO defender a copy
2. NAO explicar por que fez assim
3. PERGUNTAR: "O que especificamente nao funciona?"
4. OUVIR a resposta (ler com atencao)
5. CONFIRMAR entendimento: "Entendi: [problema]"
6. CORRIGIR seguindo o feedback exato
7. VALIDAR: "Isso atende?"
```

**NUNCA defender copy rejeitada. O usuario tem razao. Ajustar.**

### Escalada de Insatisfacao (3 Niveis)

| Nivel | Sinal | Acao |
|-------|-------|------|
| 1 — Leve | "Pode melhorar" | layered_review, ajustes pontuais |
| 2 — Moderado | "Nao e isso", "Ta generico" | Reler briefing, refazer com constraints |
| 3 — Severo | Repetiu 2x, tom irritado | PARE TUDO. Regra 2x. Faca exato. |

**Nunca deixar chegar no nivel 3. Resolver no nivel 1.**

---

## PARTE V: SINAIS CONTEXTUAIS (Copy-Specific)

### Sinais de Nicho

| Nicho | Sinal Comum | Significado |
|-------|-------------|-------------|
| Concursos | "Parece cursinho" | Copy generica, sem Mecanismo Unico |
| Saude | "Parece propaganda" | Falta credibilidade, excesso de hype |
| Relacionamento | "Ta piegas" | Emocao sem substancia, cliche relacional |
| Riqueza | "Ta golpista" | Promessa excessiva sem prova |

### Sinais por Fase

| Fase | Sinal | Significado |
|------|-------|-------------|
| Research | "Falta profundidade" | VOC superficial, precisa mais plataformas |
| Briefing | "Nao convence" | MUP fraco, Sexy Cause nao intriga |
| Production | "Nao compra" | Copy nao move para acao, falta urgencia |
| Review | "Quase" | 1-2 ajustes pontuais, nao rewrite |

---

## PARTE VI: REGRA DO 2x (Expandida)

> **Se o usuario repetiu algo 2 vezes → PARE e faca EXATAMENTE o que pediu.**

### Por que Acontece

| Causa da Repeticao | Como Evitar |
|--------------------|----|
| Claude interpretou "criativamente" | Ler LITERAL, nao "melhorar" o pedido |
| Claude adicionou coisas nao pedidas | Regra #12 (So o que Foi Pedido) |
| Claude priorizou "qualidade" sobre instrucao | Instrucao > julgamento proprio |
| Claude nao leu o pedido completo | Ler TODO o pedido antes de agir |

### Corolario

Se corrigiu o MESMO TIPO de erro 2x na mesma sessao, falta uma regra ou constraint:
1. Identificar o padrao do erro
2. Documentar em findings.md
3. Aplicar constraint explicito para o resto da sessao

---

## ENFORCEMENT

### Integracao com Outros Rules

| Sinal | Rule de Referencia |
|-------|--------------------|
| "Generico" | anti-homogeneization.md (Logo Test, Specificity Score) |
| Score baixo | debugging-hypothesis.md (3 hipoteses ordenadas) |
| "Parece IA" | anti-homogeneization.md (Palavras Banidas) |
| "Falta VOC" | voc-research.md (VOC Quality Protocol) |
| "Nao e isso" | aios-principles.md (#1 Evidencia Fisica) |
| Feature extra | aios-principles.md (#12 So o que Foi Pedido) |
| Deliverable incompleto | tool-usage-matrix.md (Checklist por Deliverable) |
| Mecanismo fraco | mecanismo-unico.md (Framework Ramalho) |

---

*v2.0 — Reescrito com base em AIOS Framework (Alan Nicolas, 10.000+ sessoes)*
*Expande v1.0: 20 sinais (era 10), 12 triggers (era 10), arvore de decisao, feedback loops*
*Contexto: Copy Chief BLACK — Copywriting Direct Response*
*Criado: 2026-02-26*
