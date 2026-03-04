# Fase 2: Deep Dive Copy-Focused

Análise de arquitetura de persuasão para concorrentes escalados.

<quando_usar>
Use na ETAPA 4 da Fase 2, após triagem e scoring dos Top 10 concorrentes. O objetivo é extrair MECANISMOS DE PERSUASAO (não features) de cada concorrente escalado.
</quando_usar>

## Mudança de Paradigma

Análise antiga (não fazer): Preço, checkout, features, pixels, garantia.
Análise copy-focused (fazer): MUP, MUS, Indutor, Reason Why, Fraquezas de copy.

O objetivo não é catalogar funcionalidades — é entender a arquitetura de persuasão que está convertendo.

## Extração de VSL via Unfunnelizer

### Players de VSL no Brasil

99% das ofertas BR usam VTURB ou Panda Video.

Sinais no HTML para VTURB: vturb.com, player.vturb
Sinais no HTML para Panda Video: pandavideo.com, player.pandavideo
Sinais para Wistia: wistia.com, fast.wistia (suporte parcial)
Sinais para Vimeo: player.vimeo.com (transcrição manual necessária)

### Ferramenta de Extração

Unfunnelizer (Chrome Extension)
URL: https://chromewebstore.google.com/detail/unfunnelizer/bdjkbgejocjhchdjmckgegngdaghnfbl

Funcionalidades: identifica player automaticamente, quebra elementos escondidos (CTA, timer), transcreve VSL automaticamente, revela estrutura do funil.

### Workflow de Extração

1. Instalar Unfunnelizer no Chrome
2. Acessar LP do concorrente
3. Ativar extensão e detectar player
4. Extrair transcrição completa
5. Identificar timestamps de CTA e revelação de preço
6. Mapear estrutura da VSL (Lead, Body, Close)

Quando Unfunnelizer não funciona: VSL em iframe protegido requer screenshot + transcrição manual. Player customizado requer DevTools Network tab. Cloaking ativo requer anti-detect browser primeiro.

## Checklist de Análise por Concorrente

<template_analise>
IDENTIFICACAO
- name: Nome do concorrente
- url: URL da LP
- scale_score: Score calculado

TRANSCRICAO VSL
- vsl_extracted: true/false
- vsl_duration: MM:SS
- vsl_player: VTURB/Panda/Wistia/Outro
- vsl_transcript_file: path do arquivo

MUP (Mecanismo Único do Problema)
- statement: A causa invisível que eles vendem
- narrative: Como explicam POR QUE o problema existe
- copy_verbatim: Copy exata da VSL/LP
- invisible_enemy: O culpado que nomeiam
- blame_target: Quem/O que culpam (sistema/vítima/natureza/terceiros)
- emotional_impact: Alta/Média/Baixa

MUS (Mecanismo Único da Solução) - 4 CAMADAS
- statement: Como explicam POR QUE a solução funciona
- copy_verbatim: Copy exata

Camada 1 - Hero Ingredient:
  - name: Nome do ingrediente/método principal
  - uniqueness: O que torna especial
  - reason_why: Por que funciona

Camada 2 - Gimmick Name:
  - name: Nome memorável do método/produto
  - has_name: true/false
  - memorability: Alta/Média/Baixa

Camada 3 - Origin Story:
  - exists: true/false
  - type: Descoberta pessoal/Pesquisa/Acidente/Herança/Revelação
  - protagonist: Quem descobriu
  - discovery_moment: Como descobriu
  - copy_verbatim: Trecho da story

Camada 4 - Authority Hook:
  - type: Credencial/Mídia/Resultado próprio/Científico/Social
  - proof: Evidência específica
  - verifiable: true/false

INDUTOR DO MECANISMO
- statement: O que especificamente faz o mecanismo funcionar
- type: Científico/Estatístico/Experiencial/Lógico/Emocional
- credibility: Alta/Média/Baixa

REASON WHYS (Provas Lógicas)
Lista de provas com: type, statement, verifiable, copy_verbatim

HORROR STORIES
Lista com: solution_attacked, story, emotions_triggered, copy_verbatim

FRAQUEZAS DE COPY
Lista com: weakness, attack_angle, copy_suggestion

ESTRUTURA DA VSL
- lead_type: Problema/História/Pergunta/Choque/Prova
- lead_duration: MM:SS
- body_structure: Problema-Agitate-Solve/Before-After/Story-based
- price_reveal: MM:SS
- cta_type: Imediato/Atrasado/Timer/Múltiplo

AVATAR IMPLICITO
- age_range: Faixa etária
- situation: Situação de vida
- pain_level: Intensidade da dor
- copy_verbatim: Bullets "É para você se..."
</template_analise>

## Matriz de MUPs do Mercado

### Como Identificar o MUP Real

O MUP não é o PROBLEMA — é a CAUSA INVISÍVEL do problema.

Exemplos de distinção:
- NAO e MUP: "Você não passa em concurso" / E MUP: "Você estuda o que NAO cai na prova"
- NAO e MUP: "Você está acima do peso" / E MUP: "Seu metabolismo foi desligado por toxinas"
- NAO e MUP: "Seu casamento está em crise" / E MUP: "A TPM Masculina destrói a paixão dele"
- NAO e MUP: "Você não tem dinheiro" / E MUP: "O sistema foi feito para te manter pobre"

### Template de Mapeamento de MUP

<mup_template>
MUP #N: "NOME DO MUP"

Quem usa: Lista de concorrentes
Narrativa central: Como explicam a causa

Copy verbatim:
> Trecho exato da VSL/LP

Problema invisível vendido: O que o público passa a acreditar
Culpado nomeado: Sistema/Vítima/Natureza/Indústria/Terceiros
Solução implícita: O que fica óbvio que resolve

Análise de Força (1-5 cada):
- Novidade: X
- Credibilidade: X
- Emoção: X
- Acionabilidade: X
- TOTAL: X/20

Fraquezas para atacar:
- Fraqueza 1
- Fraqueza 2
</mup_template>

## Matriz de MUS — 4 Camadas

### As 4 Camadas Obrigatórias

Todo MUS escalado tem estas 4 camadas (mesmo que implícitas):

Camada 1 - Hero Ingredient: O que especificamente resolve?
Camada 2 - Gimmick Name: Qual nome chiclete memorável?
Camada 3 - Origin Story: Como foi descoberto?
Camada 4 - Authority Hook: Por que acreditar?

### Template de Mapeamento de MUS

<mus_template>
MUS #N: "NOME DO MUS"

Quem usa: Lista de concorrentes

Camada 1 - Hero Ingredient:
- Nome: Nome do ingrediente/método
- Por que é hero: O que torna único
- Copy: Trecho exato

Camada 2 - Gimmick Name:
- Nome chiclete: Presente/Ausente
- Se presente: Nome
- Memorabilidade: Alta/Média/Baixa

Camada 3 - Origin Story:
- Tipo: Descoberta/Acidente/Pesquisa/Revelação
- Protagonista: Quem
- Momento: Como descobriu
- Copy: Trecho da origin story

Camada 4 - Authority Hook:
- Tipo: Credencial/Mídia/Caso/Estudo
- Prova: Evidência específica
- Verificável: Sim/Não

Análise de Força (1-5 cada):
- Digestibilidade: X
- Unicidade: X
- Plausibilidade: X
- Memorabilidade: X
- TOTAL: X/20

Fraquezas para atacar:
- Fraqueza 1
- Fraqueza 2
</mus_template>

## Horror Stories do Mercado

### O que são Horror Stories

Histórias de FRACASSO com soluções alternativas que geram identificação ("isso aconteceu comigo!"), eliminam objeções ("já tentei X e não funcionou") e posicionam o novo método como diferente.

### Fontes de Horror Stories

- Reviews 1 estrela Amazon: Frustração com soluções existentes
- Comentários YouTube: Relatos de fracasso
- Reddit/Fóruns: Desabafos anônimos
- Grupos Facebook: Histórias pessoais
- VSLs concorrentes: Horror stories que ELES usam
- ReclameAqui: Reclamações específicas

### Template de Horror Story

<horror_template>
Horror Story #N: "TITULO CURTO"

Fonte: Reddit/YouTube/Amazon/VSL Concorrente
Link/Referência: URL

Narrativa (copy-paste):
> História exata como contada

Solução que falhou: Qual alternativa não funcionou
Por que falhou: Razão implícita ou explícita
Emoções ativadas: Lista de emoções

Uso potencial na copy:
- Lead: Como usar no gancho
- Body: Como usar no corpo
- Objeção: Qual objeção neutraliza
</horror_template>

## Origin Stories Disponíveis

### Tipos de Origin Story

- Descoberta pessoal: Fundador sofreu o problema e descobriu (força alta)
- Acidente: Descoberta não intencional (força alta)
- Pesquisa: Estudo sistemático revelou (força média-alta)
- Herança: Segredo passado por gerações (força média)
- Revelação: Insider revelou segredo (força média-alta)
- Mídia: Coberto por veículo respeitado (força alta)

### Checklist de Origin Story

- [ ] Tem protagonista específico (nome, idade, situação)?
- [ ] Tem momento de descoberta claro?
- [ ] Tem origem crível (lugar, instituição, grupo)?
- [ ] Gera identificação com o avatar?
- [ ] É memorável?

### Origin Stories Não Capturadas

<origin_template>
Origin Story Disponível: "NOME"

Resumo: Descrição breve
Fonte original: Mídia, artigo, etc.
Verificabilidade: Alta/Média/Baixa

Por que ninguém usa:
- Razão 1
- Razão 2

Potencial para nossa oferta:
- Como podemos usar
- Adaptação necessária
</origin_template>

## Reason Whys — Provas Lógicas

### Tipos de Reason Why

- Estatística: "73% dos usuários..." (força alta se específico)
- Estudo científico: "Publicado na Nature..." (força muito alta)
- Case específico: "João, 45 anos, perdeu 20kg" (força alta)
- Autoridade: "Dr. Fulano, Harvard..." (força alta)
- Lógica/Analogia: "Assim como um carro precisa de óleo..." (força média)
- Prova social: "Mais de 10.000 clientes..." (força média-alta)
- Mídia externa: "Como visto no G1..." (força muito alta)

### Template de Reason Why

<reason_template>
Reason Why #N: "TIPO"

Quem usa: Concorrentes
Statement: A afirmação/prova
Copy verbatim: Como usam na copy
Verificável: Sim/Não/Parcialmente
Força persuasiva: Alta/Média/Baixa

Oportunidade: Como podemos usar melhor
</reason_template>

## Fraquezas de Copy para Atacar

### Tipos de Fraqueza

Categoria MUP fraco: Culpa a vítima, muito abstrato, já saturado
Categoria MUS vago: Sem nome chiclete, sem origin story
Categoria Prova fraca: Testimonials fake, sem verificação
Categoria Avatar genérico: Não fala com ninguém específico
Categoria Vilão ausente: Não nomeia inimigo claro
Categoria Emoção superficial: Foca em features, não em dor
Categoria Autoridade questionável: Credenciais não verificáveis

### Template de Ataque

<attack_template>
Fraqueza: "DESCRICAO"

Concorrente(s): Quem tem essa fraqueza
Evidência: Como identificamos

Ângulo de ataque:
> Copy sugerida de ataque

Onde usar:
- [ ] Lead/Hook
- [ ] Body (contraste)
- [ ] Objeção
- [ ] Close
</attack_template>

## Formatos e Superestruturas

### Matriz de Formatos

VSL Talking Head: Saturação alta, performance média — evitar
VSL Podcast: Saturação média, performance alta — testar
Quiz + Mini VSL: Saturação baixa, performance alta — priorizar
Documentário: Saturação baixa, performance alta — testar
Entrevista: Saturação média, performance média-alta — possível

### Superestruturas

Descoberta científica proibida: Saturação média, funciona em Saúde/ED
Case de terceira pessoa: Saturação baixa-média, funciona em todos
Método ancestral/tribal: Saturação alta, funciona em Saúde/ED
Insider revela segredo: Saturação média, funciona em Riqueza/Concursos
Fundador que sofreu o problema: Saturação baixa, funciona em Relacionamento/Riqueza

## Output Final do Deep Dive

### Estrutura de Entrega

```
/fase2_deep_dive_copy/
  01_mups_mapeados.md
  02_mus_mapeados.md
  03_horror_stories.md
  04_origin_stories.md
  05_reason_whys.md
  06_fraquezas_atacaveis.md
  07_formatos_validados.md
  08_transcricoes_vsl/
    concorrente_01.txt
    concorrente_02.txt
  09_matriz_consolidada.md
```

### Matriz Consolidada

A matriz final deve cruzar todos os concorrentes analisados comparando: MUP usado, MUS usado, presença de Nome Chiclete, presença de Origin Story, força da Authority, fraqueza principal. A última coluna deve indicar GAPS identificados.

## Integração com Outras Fases

Fase 3 (Avatar) recebe: Avatares implícitos nos concorrentes
Fase 5 (MUP) recebe: Gaps de MUP não explorados
Fase 6 (MUS) recebe: 4 camadas diferenciadas
Fase 7 (Offer) recebe: Fraquezas de oferta para superar
Fase 9 (Leads) recebe: Ângulos de ataque validados
Fase 10 (Progressão) recebe: Horror stories para usar

Princípio: Deep Dive Copy alimenta a arquitetura de persuasão de todo o briefing.
