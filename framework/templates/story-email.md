---
template_name: "story-email"
template_version: "1.0.0"
template_type: "story"
description: "Story template para producao de emails individuais com contexto de sequencia"
phase: "production"
deliverable_type: "email"
output_format: "markdown"
---

# Story: Email [SEQUENCIA] #[##] — [OFFER_NAME]

> Template: story-email.md v1.0
> Criado: [DATA]
> Oferta: [NICHO]/[OFERTA]
> Fase: PRODUCTION
> Ref: email-sequence-template.md (arquitetura de sequencias)

---

## Status
- [ ] Story criada
- [ ] Contexto da sequencia definido
- [ ] Email anterior revisado (continuidade)
- [ ] Producao iniciada
- [ ] Subject lines criadas (3+ variacoes)
- [ ] Primeira versao completa
- [ ] blind_critic >= 8
- [ ] emotional_stress_test >= 8
- [ ] black_validation >= 8
- [ ] Humano aprovou

---

## Identificacao do Email

| Campo | Valor |
|-------|-------|
| **Sequencia** | [WELCOME/NURTURE/CONVERSION/RETENTION/CART-ABANDON/LAUNCH/REENGAGEMENT] |
| **Email # na Sequencia** | [##] de [total] |
| **Dia de Envio** | D+[X] (relativo ao trigger) |
| **Trigger de Entrada** | [o que colocou o lead nesta sequencia: opt-in / compra / abandono / etc] |
| **Objetivo DESTE Email** | [1 frase: o que este email especifico deve alcancar] |
| **CTA Principal** | [acao desejada] |
| **Destino do CTA** | [URL/pagina: VSL / LP / Checkout / Conteudo] |

---

## Posicao na Sequencia (Contexto Completo)

### Mapa da Sequencia

| # | Dia | Tipo | Objetivo | Lead/Angulo | Status |
|---|-----|------|----------|-------------|--------|
| 1 | D+0 | [tipo] | [objetivo] | [angulo] | [feito/pendente] |
| 2 | D+1 | [tipo] | [objetivo] | [angulo] | [feito/pendente] |
| 3 | D+2 | [tipo] | [objetivo] | [angulo] | [feito/pendente] |
| 4 | D+3 | [tipo] | [objetivo] | [angulo] | [feito/pendente] |
| 5 | D+4 | [tipo] | [objetivo] | [angulo] | [feito/pendente] |
| 6 | D+5 | [tipo] | [objetivo] | [angulo] | [feito/pendente] |
| 7 | D+6 | [tipo] | [objetivo] | [angulo] | [feito/pendente] |

**Este email e o #[X]** — marcado acima.

### Arquitetura por Tipo de Sequencia

**WELCOME (5-7 emails):**
Entregar lead magnet → Introduzir expert → Agitar problema → Revelar mecanismo → Apresentar solucao → Prova social → CTA final

**NURTURE (7-14 emails):**
Educar sobre problema → Destruir mitos → Revelar mecanismo (gradual) → Cases → Solucao falsa #1 → Solucao falsa #2 → Produto como resposta → Stack → Objecoes → Urgencia

**CONVERSION/LAUNCH (5-9 emails):**
Antecipacao → Problema agitado → Teaser → Abertura → Beneficios → Prova → Objecoes → Escassez → Ultima chance

**CART ABANDON (3-5 emails):**
Lembrete suave → Objecoes/FAQ → Urgencia + bonus → Ultimo aviso → Consequencia

**RETENTION (ongoing):**
Onboarding → Quick win → Feature spotlight → Case study → Check-in → Upgrade teaser

**REENGAGEMENT (3-5 emails):**
"Sentimos sua falta" → Novo conteudo/angulo → Oferta especial → Ultimato → Limpeza de lista

---

## Estado Emocional do Lead

### O Que Aconteceu ANTES Deste Email

| Campo | Valor |
|-------|-------|
| **Email anterior enviado** | [tipo + subject do email anterior] |
| **Acao esperada no email anterior** | [clicou / leu / ignorou] |
| **Estado emocional provavel** | [curioso / motivado / cetico / indiferente / ansioso / pronto] |
| **Nivel de consciencia** | [Unaware / Problem Aware / Solution Aware / Product Aware / Most Aware] |
| **Confianca no expert/marca** | [baixa / media / alta] |

### O Que Este Email Deve MUDAR

| Campo | Valor |
|-------|-------|
| **Estado emocional de ENTRADA** | [como o lead abre este email] |
| **Estado emocional de SAIDA** | [como o lead deve fechar este email] |
| **Mudanca de consciencia** | [de X → para Y] |
| **Crenca a instalar/reforcar** | [qual crenca este email planta] |
| **Objecao a neutralizar** | [qual objecao este email enderea] |

### Progressao Emocional da Sequencia

```
Email 1: [emocao] ─── Email 2: [emocao] ─── Email 3: [emocao]
    │                     │                      │
    v                     v                      v
[nivel consc.]        [nivel consc.]         [nivel consc.]
```
**Este email:** posicao [X] na progressao acima.

---

## Contexto HELIX

### MUP
> Fonte: mecanismo-unico.yaml

- **Sexy Cause:** [nome]
- **Usado neste email?** [SIM/NAO]
- **Se SIM, como:** [revelacao parcial / referencia / completo]

### MUS
> Fonte: mecanismo-unico.yaml

- **Gimmick Name:** [nome]
- **Ingrediente Hero:** [componente]
- **Authority Hook:** [validacao]
- **Usado neste email?** [SIM/NAO]
- **Se SIM, como:** [teaser / apresentacao / reforco]

### DRE
- **Emocao:** [qual]
- **Nivel de ativacao neste email:** [1-5]
- **Tipo de ativacao:** [direta (agitar dor) / indireta (consequencia) / implicita (story)]

### One Belief
"[crenca unica]"
**Este email contribui para instalar o One Belief?** [SIM/NAO — como]

### Lead NUUPPECC
> Fonte: briefings/phases/fase-09.md

**Lead selecionado para ESTE email:** [News / Utility / Unbelievable / Proof / Pain / Emotion / Curiosity / Controversy]
**Justificativa:** [por que este lead para este email especifico]

### Horror Story
> Fonte: briefings/phases/fase-10.md

**Horror story usada neste email:** [qual — se aplicavel]

---

## Subject Line + Preview Text

### Subject Line Principal (Max 50 caracteres)
```
[Subject line principal]
```

### Variacoes para Teste (Minimo 3)

| Variacao | Subject Line | Tipo | Angulo |
|----------|-------------|------|--------|
| A (controle) | "[subject]" | [curiosidade/urgencia/beneficio/pergunta/numero/story/controversa] | [angulo] |
| B | "[subject]" | [tipo] | [angulo] |
| C | "[subject]" | [tipo] | [angulo] |

### Preview Text (Max 90 caracteres)
```
[Texto que aparece apos o subject no inbox — COMPLEMENTA, nao repete]
```

### Checklist do Subject
- [ ] < 50 caracteres
- [ ] Cria curiosidade ou urgencia
- [ ] Linguagem do avatar (nao marketer)
- [ ] Preview text complementa (nao repete)
- [ ] Nao parece spam (sem ALL CAPS excessivo, sem !!!)
- [ ] Passaria no "Inbox Test" (abriria se recebesse?)

---

## VOC Quotes (Para Este Email)

### Quotes para Abertura (Gancho)
| Quote | Emocao | Uso |
|-------|--------|-----|
| "[quote]" — @user | [emocao] | [como usar para abrir o email] |

### Quotes para Body
| Quote | Emocao | Uso |
|-------|--------|-----|
| "[quote]" — @user | [emocao] | [como usar no corpo] |

### Linguagem do Avatar
- [como o avatar fala sobre ESTE topico especifico do email]
- [palavras/expressoes que usar vs evitar]

---

## Segmentacao

### Quem Recebe Este Email

| Criterio | Valor |
|----------|-------|
| **Segmento** | [todos / compradores / nao-compradores / clicou email X / etc] |
| **Exclusoes** | [quem NAO recebe: ja comprou / unsubscribed / etc] |
| **Condicional** | [se [acao], enviar versao A; se nao, versao B] |

### Personalizacao

| Variavel | Fonte | Exemplo |
|----------|-------|---------|
| [nome] | CRM | "Ola, {{nome}}" |
| [interesse] | Quiz/tag | "Voce que [interesse]" |
| [produto visto] | Tracking | "Sobre o [produto]..." |

---

## Estrutura do Email

### Abertura (Gancho — Primeiras 2 Linhas)
> Estas linhas determinam se o email e LIDO ou DELETADO.

```
{{nome}},

[Primeira linha — gancho forte que cria curiosidade ou conexao]

[Segunda linha — expande ou direciona]
```

### Desenvolvimento (Body)
```
[Corpo principal — desenvolver argumento/story/revelacao]

[Bullets para escaneabilidade:]
• [Ponto 1 — beneficio ou insight]
• [Ponto 2]
• [Ponto 3]

[Continuar narrativa se necessario...]
```

### CTA (Claro e Unico)
```
[Frase de transicao para o CTA]

>>> [TEXTO DO LINK/BOTAO] <<<

[Reforco do CTA de forma diferente — opcional]
```

### Assinatura + P.S.
```
[Assinatura padrao]

P.S. [Ultimo argumento, urgencia, ou beneficio — muitas pessoas leem so o P.S.]
```

---

## Patterns Aplicaveis

### Por Tipo de Email

**Story Email:**
- [ ] Personagem relatable (avatar se ve nele)
- [ ] Conflito/desafio concreto
- [ ] Descoberta/virada (conectada ao MUP/MUS)
- [ ] Resolucao com produto (natural, nao forcada)
- [ ] CTA emerge da story

**Problema Email:**
- [ ] Sinestesia emocional (cena vivida)
- [ ] Situacao especifica (nao generica)
- [ ] Consequencias de nao agir (escalada)
- [ ] Vilao externo (externaliza culpa)
- [ ] Transicao para solucao (tease)

**Prova Email:**
- [ ] Depoimento com nome/contexto real
- [ ] Numeros especificos de resultado
- [ ] Antes/depois com detalhes
- [ ] "Alguem como voce" (relatabilidade)
- [ ] CTA apos prova (momentum)

**Urgencia Email:**
- [ ] Deadline especifico (real)
- [ ] O que se perde (FOMO concreto)
- [ ] Escassez real (vagas/bonus/preco)
- [ ] CTA multiplas vezes (2-3x)
- [ ] Consequencia de nao agir

**Objecao Email:**
- [ ] Objecao nomeada diretamente
- [ ] Resposta com prova (nao so argumento)
- [ ] Garantia reforçada
- [ ] FAQ style ou story style

### Anti-Patterns
1. **[anti_pattern]:** [evitar porque]
2. **[anti_pattern]:** [evitar porque]

### Cliches Proibidos
| Proibido | Substituir Por |
|----------|---------------|
| [cliche] | [alternativa especifica] |
| [cliche] | [alternativa especifica] |

---

## Acceptance Criteria

### Obrigatorios (Todos os Emails)
- [ ] Subject line < 50 caracteres
- [ ] Preview text complementa (nao repete) subject
- [ ] Primeira linha cria curiosidade ou conexao
- [ ] Linguagem do avatar (nao marketer-speak)
- [ ] CTA claro e unico por email
- [ ] P.S. com reforco relevante
- [ ] Especificidade Score >= 8
- [ ] Zero palavras banidas
- [ ] Zero cliches do nicho
- [ ] Progressao logica na sequencia (nao repete email anterior)
- [ ] Cada email tem objetivo UNICO (nao tenta fazer tudo)

### Por Posicao na Sequencia
- **Email 1 (Welcome):** Entrega prometida + introduz expert + planta curiosidade
- **Emails 2-3 (Educacao):** Agita problema + destroi solucoes falsas
- **Emails 4-5 (Revelacao):** Revela mecanismo + apresenta solucao
- **Emails 6-7 (Prova):** Mostra resultados + enderea objecoes
- **Ultimo Email:** Urgencia real + consequencia + CTA multiplo

---

## Metricas Target

| Metrica | Benchmark | Target | Acao se Abaixo |
|---------|-----------|--------|----------------|
| Open Rate | 20-30% | >25% | Revisar subject lines |
| CTR | 2-5% | >3% | Revisar CTA + body |
| Unsubscribe | <0.5% | <0.3% | Verificar frequencia/relevancia |
| Reply Rate | >1% | >2% | Email muito "broadcast", humanizar |

---

## Tasks

### Pre-Producao
- [ ] Ler story do email anterior na sequencia
- [ ] Ler CONTEXT.md + mecanismo-unico.yaml
- [ ] Carregar fase 09 (NUUPPECC Leads) + fase 10 (Horror Stories)
- [ ] Definir estado emocional de entrada/saida
- [ ] Definir lead NUUPPECC para este email
- [ ] Preencher contexto HELIX e VOC nesta story

### Producao
- [ ] Criar subject line principal + 3 variacoes
- [ ] Escrever preview text
- [ ] Escrever abertura (gancho)
- [ ] Escrever body
- [ ] Escrever CTA
- [ ] Escrever P.S.
- [ ] Output em: `production/emails/[sequencia]/email-[##]-[tipo].md`

### Pos-Producao (Por Email)
- [ ] blind_critic (copy_type: "body") — score: ___
- [ ] Verificar acceptance criteria
- [ ] Verificar continuidade com email anterior/proximo

### Integracao (Apos TODA a Sequencia)
- [ ] emotional_stress_test na sequencia completa — score: ___
- [ ] layered_review (3 camadas) na sequencia completa
- [ ] black_validation na sequencia completa — score: ___
- [ ] Progressao emocional coerente do email 1 ao ultimo
- [ ] Nenhum email repete argumento de outro
- [ ] Frequencia adequada (nao cansa o lead)

---

## Dev Notes

### Decisoes de Copy (Este Email)
[Por que este angulo, este lead NUUPPECC, este tom.
Ex: "Usei lead Pain no email 3 porque e o ponto de maxima agitacao antes da revelacao no email 4. VOC mostrou que quotes de frustacao nivel 4 sao as mais frequentes neste avatar."]

### Insights de Sessoes Anteriores
[Contexto preservado — especialmente decisoes sobre a sequencia como um todo]

### Versoes
| # | Data | Score BC | Subject Line | Mudanca Principal |
|---|------|----------|-------------|-------------------|
| 1 | | | "[subject]" | Primeira versao |
| 2 | | | "[subject]" | [mudanca] |

---

## QA Results

### blind_critic
- **Score:** ___/10
- **Feedback:** [resumo]
- **Acoes:** [o que mudou]

### emotional_stress_test (sequencia completa)
- **Score:** ___/10
- **Genericidade:** ___/10
- **Feedback:** [resumo]

### black_validation (sequencia completa)
- **Score:** ___/10
- **Gate:** [PASSED/FAILED]
- **Feedback:** [resumo]

---

## Rastreabilidade

| Campo | Valor |
|-------|-------|
| **Sequencia** | [tipo] |
| **Email** | #[XX] de [total] |
| **Arquivo de output** | production/emails/[sequencia]/email-[##]-[tipo].md |
| **Sequencia completa em** | production/emails/[sequencia]/sequencia-completa.md |
| **Story do email anterior** | story-email-[sequencia]-[##].md |
| **Story do proximo email** | story-email-[sequencia]-[##].md |
| **Lead NUUPPECC usado** | [qual] |
| **Sessoes utilizadas** | [numero] |

---

*story-email.md v1.0 — Story-Driven Email Production*
*Sequencia completa com estado emocional, segmentacao e progressao*
*Ref: email-sequence-template.md para arquitetura de sequencias*
