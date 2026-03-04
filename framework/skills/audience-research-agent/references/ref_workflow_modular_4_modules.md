# Guia de Extração de Voice of Customer - Arquitetura Modular

> **Usar para:** Fase 2 do workflow - Pesquisa VOC Modular
> **Arquitetura:** Research amplo + Extração por plataforma (por tema)

---

## Visão Geral da Arquitetura

```
MÓDULO TEMÁTICO
│
├── X.X.1 RESEARCH (Amplo)
│   │   Deep search sem limitação de plataforma
│   │   Encontra insights onde conseguir
│   └── Output: Insights sobre [tema]
│
├── X.X.2 EXTRAÇÃO (Por Plataforma)
│   │
│   ├── X.X.2.1 YouTube
│   │   ├── Descoberta: buscar vídeos virais sobre [tema]
│   │   ├── Seleção: escolher URLs
│   │   └── Extração: Apify
│   │
│   ├── X.X.2.2 Instagram
│   │   ├── Descoberta
│   │   ├── Seleção
│   │   └── Extração
│   │
│   ├── X.X.2.3 TikTok
│   │   ├── Descoberta
│   │   ├── Seleção
│   │   └── Extração
│   │
│   └── X.X.2.4 Reddit
│       ├── Descoberta
│       ├── Seleção
│       └── Extração
│
└── X.X.3 CONSOLIDAÇÃO
    └── Une research + extrações em [tema]_projeto.md
```

---

## Módulo DORES

### 2.2.1 Research de Dores

**Objetivo:** Entender as dores do público de forma ampla

**Sugestões de queries (não restrições):**
- "frustrações com [categoria]"
- "por que pessoas desistem de [X]"
- "[nicho] não funciona"
- "problemas com [solução atual]"
- "o que ninguém conta sobre [X]"
- "arrependimento [categoria]"
- "erro que cometi [nicho]"

**O que buscar:**
- Artigos sobre frustrações comuns
- Estudos de mercado
- Discussões em fóruns
- Análises de especialistas
- Qualquer fonte que o research encontrar

### 2.2.2 Extração de Dores por Plataforma

#### 2.2.2.1 YouTube - Dores
**Descoberta:** Buscar vídeos sobre:
- "Por que desisti de [X]"
- "Erros que cometi"
- "O que ninguém conta"
- "Minha experiência negativa"

**Seleção:** Priorizar vídeos com:
- 100+ comentários
- Engajamento alto (likes/views)
- Últimos 12 meses

**Extração:** Actor `streamers/youtube-comments-scraper`

#### 2.2.2.2 Instagram - Dores
**Descoberta:** Buscar posts sobre:
- Desabafos de influenciadores
- Posts de "momento real"
- Conteúdo vulnerável

**Extração:** Actor `apify/instagram-comment-scraper`

#### 2.2.2.3 TikTok - Dores
**Descoberta:** Buscar:
- Storytimes de fracasso
- "O dia que eu quase desisti"
- Trends sobre dificuldades

**Extração:** Actor `clockworks/tiktok-comments-scraper`

#### 2.2.2.4 Reddit - Dores
**Descoberta:** Buscar em:
- r/desabafos
- Subreddits do nicho
- Threads de frustração

**Extração:** Actor `trudax/reddit-scraper`

### 2.2.3 Consolidação de Dores

**ATENÇÃO:** Nesta fase, apenas ORGANIZE - não classifique com frameworks.

**Fazer:**
- Agrupar citações por tema/assunto
- Remover duplicatas exatas
- Preservar linguagem VERBATIM
- Indicar fonte (plataforma, URL)

**NÃO fazer:**
- [X] Classificar por Hierarquia de Dor (isso é FASE 3)
- [X] Resumir ou parafrasear
- [X] Interpretar ou analisar

**Output:** `dores_[projeto].md` (citações brutas organizadas por tema)

---

## Módulo DESEJOS

### 2.3.1 Research de Desejos

**Sugestões de queries:**
- "como seria se eu conseguisse [X]"
- "sonho de [resultado]"
- "transformação [nicho]"
- "o que eu mais quero é"
- "minha vida ideal"
- "se eu pudesse [resultado]"
- "finalmente consegui [X]"

### 2.3.2 Extração de Desejos por Plataforma

#### 2.3.2.1 YouTube - Desejos
**Descoberta:** Vídeos de:
- Transformação
- Success stories
- "Como consegui [X]"
- Antes e depois

#### 2.3.2.2 Instagram - Desejos
**Descoberta:** Posts de:
- Antes/depois
- Conquistas
- Lifestyle aspiracional
- Celebração de resultados

#### 2.3.2.3 TikTok - Desejos
**Descoberta:**
- Trends de conquista
- "POV: você conseguiu [X]"
- Transformações virais

#### 2.3.2.4 Reddit - Desejos
**Descoberta:**
- Threads de celebração
- "Finalmente consegui"
- Goals alcançados

### 2.3.3 Consolidação de Desejos

**ATENÇÃO:** Nesta fase, apenas ORGANIZE - não classifique com frameworks.

**Fazer:**
- Agrupar citações por tema/assunto
- Remover duplicatas exatas
- Preservar linguagem VERBATIM
- Indicar fonte (plataforma, URL)

**NÃO fazer:**
- [X] Classificar por tipo (Declarados/Implícitos/Secretos) - isso é FASE 3
- [X] Resumir ou parafrasear
- [X] Interpretar ou analisar

**Output:** `desejos_[projeto].md` (citações brutas organizadas por tema)

---

## Módulo OBJEÇÕES

### 2.4.1 Research de Objeções

**Sugestões de queries:**
- "[produto/categoria] vale a pena?"
- "por que não comprar [X]"
- "[solução] funciona mesmo?"
- "reviews [categoria]"
- "reclamações [tipo de produto]"
- "[X] é furada?"
- "antes de comprar [X]"

### 2.4.2 Extração de Objeções por Plataforma

#### 2.4.2.1 YouTube - Objeções
**Descoberta:** Vídeos de:
- Reviews honestos
- "Vale a pena?"
- "A verdade sobre [X]"
- Comparativos

#### 2.4.2.2 Instagram - Objeções
**Descoberta:**
- Comentários céticos em posts de venda
- Perguntas de objeção
- Dúvidas nos comentários

#### 2.4.2.3 TikTok - Objeções
**Descoberta:**
- "A verdade sobre [X]"
- Exposés
- Vídeos de ceticismo

#### 2.4.2.4 Reddit - Objeções
**Descoberta:**
- Threads "vale a pena?"
- Comparativos
- Ceticismo organizado

### 2.4.3 Consolidação de Objeções

**Classificar por tipo:**
- **Preço:** "muito caro", "não tenho dinheiro"
- **Tempo:** "não tenho tempo", "demora muito"
- **Esforço:** "muito difícil", "não vou conseguir"
- **Ceticismo:** "não funciona", "já tentei antes", "é golpe"
- **Adequação:** "não é pra mim", "meu caso é diferente"

**Output:** `objecoes_[projeto].md`

---

## Módulo LINGUAGEM

### 2.5.1 Research de Linguagem

**Focos de pesquisa:**
- Como o público descreve o problema
- Expressões e metáforas utilizadas
- Gírias geracionais
- Termos técnicos vs populares
- Palavras carregadas emocionalmente

### 2.5.2 Extração de Linguagem por Plataforma

#### 2.5.2.1 YouTube - Linguagem
**Foco:** Comentários com linguagem emocional carregada

#### 2.5.2.2 Instagram - Linguagem
**Foco:** Expressões curtas, padrões de emoji, hashtags

#### 2.5.2.3 TikTok - Linguagem
**Foco:** Gírias geracionais, trends linguísticos, expressões de época

#### 2.5.2.4 Reddit - Linguagem
**Foco:** Linguagem detalhada, contexto rico, termos técnicos

### 2.5.3 Consolidação de Linguagem

**Classificar por tipo:**
- **Metáforas:** Como descrevem problema/solução
- **Expressões:** Frases repetidas pelo público
- **Emocional:** Palavras carregadas
- **Geracional:** Gírias de época/faixa etária

**Catálogo de gírias TikTok:**
- "não tanko" = não aguento
- "é sobre isso" = identificação
- "surto" = momento de crise
- "chorando" = afetado emocionalmente

**Output:** `linguagem_[projeto].md`

---

## Fluxo de Extração (Todas as Plataformas)

```
┌─────────────────────────────────────────────────────────────────┐
│  DESCOBERTA                                                     │
│                                                                 │
│  Buscar conteúdo viral sobre [tema] na plataforma               │
│  Usar web_search ou ferramentas da plataforma                   │
│                                                                 │
│  Critérios:                                                     │
│  • Alto engajamento (comentários, likes, views)                 │
│  • Relevância para o tema                                       │
│  • Recente (últimos 12 meses preferencialmente)                 │
│                                                                 │
│  Output: Lista de URLs promissoras                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SELEÇÃO                                                        │
│                                                                 │
│  Apresentar URLs encontradas ao usuário:                        │
│  "Encontrei X vídeos/posts sobre [tema]. Quais extrair?"        │
│                                                                 │
│  1. [URL] - [título] - [X comentários]                          │
│  2. [URL] - [título] - [X comentários]                          │
│  3. [URL] - [título] - [X comentários]                          │
│                                                                 │
│  Usuário escolhe quais URLs processar                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  EXTRAÇÃO                                                       │
│                                                                 │
│  Executar Apify no(s) URL(s) selecionado(s)                     │
│                                                                 │
│  Actors por plataforma:                                         │
│  • YouTube: streamers/youtube-comments-scraper                  │
│  • Instagram: apify/instagram-comment-scraper                   │
│  • TikTok: clockworks/tiktok-comments-scraper                   │
│  • Reddit: trudax/reddit-scraper                                │
│                                                                 │
│  Filtrar resultados:                                            │
│  • Remover spam/bots                                            │
│  • Priorizar comentários com engagement                         │
│  • Manter apenas relevantes ao tema                             │
│                                                                 │
│  Output: Quotes verbatim classificadas                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist por Módulo

Antes de consolidar cada módulo:

- [ ] Research amplo executado
- [ ] Pelo menos 1 plataforma extraída (se fonte rica identificada)
- [ ] Quotes classificadas por subtipo
- [ ] Padrões repetidos identificados
- [ ] Confidence scores atribuídos

---

## Matriz de Plataformas por Tema

| Plataforma | Dores | Desejos | Objeções | Linguagem |
|------------|:-----:|:-------:|:--------:|:---------:|
| YouTube | ★★★ | ★★★ | ★★★ | ★★☆ |
| Instagram | ★★☆ | ★★★ | ★★☆ | ★★☆ |
| TikTok | ★★★ | ★★☆ | ★★☆ | ★★★ |
| Reddit | ★★★ | ★★☆ | ★★★ | ★★★ |

**Legenda:**
- ★★★ = Excelente fonte para este tema
- ★★☆ = Boa fonte
- ★☆☆ = Fonte secundária
