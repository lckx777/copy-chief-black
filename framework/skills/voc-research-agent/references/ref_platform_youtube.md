# YouTube Extraction

## IMPORTANTE: Tool Priority
**SEMPRE usar Apify para extração de YouTube. WebSearch é ÚLTIMO RESORT.**

Ordem obrigatória:
1. Apify `streamers/youtube-scraper` (5min timeout)
2. Playwright direto se Apify falha
3. Firecrawl se Playwright falha
4. WebSearch APENAS se tudo falha

**NUNCA pular direto para WebSearch.**

---

## Actor Principal

streamers/youtube-scraper

Input otimizado para VOC: searchQueries com termo de busca, maxResults 5 vídeos por busca, downloadSubtitles false (não necessário para comentários).

Para vídeos específicos já conhecidos: startUrls com array de URLs, maxResults 1 por URL.

Alternativa se principal falhar: apidojo/youtube-scraper com keywords e maxItems.

Para transcrições de vídeos (linguagem de creators): pintostudio/youtube-transcript-scraper com videoUrl.

---

## Viral-First Strategy (OBRIGATÓRIO)

### Passo 1: Discovery de Virais
Antes de extrair comentários, identificar TOP 10 vídeos mais engajados:
- Buscar por viewCount decrescente
- Threshold mínimo: **10K+ views OU 500+ comments**
- Usar `sort=viewCount` nos parâmetros de busca

### Passo 2: Registrar Métricas
Para cada vídeo viral, capturar:
- viewCount (views)
- commentCount (total comments)
- likeCount (likes do vídeo)
- duration (duração)

### Passo 3: Análise de Formato
Registrar para cada viral:
- **Duração:** shorts (<60s) vs médio (1-10min) vs longo (>10min)
- **Formato:** talking head / slide / animação / screen recording
- **Hook do título:** primeiras 5 palavras
- **Thumbnail style:** face close-up / texto / gráfico / clickbait

### Passo 4: Extrair Apenas de Virais
- Extrair comentários APENAS dos top 10 vídeos
- Priorizar comentários com mais likes (mais autênticos)
- Target: 50 comments de alta qualidade

---

## Estratégia de Discovery

Executar web_search com "[tema] site:youtube.com" para encontrar vídeos relevantes. **Filtrar por viewCount para identificar virais.** Priorizar vídeos com 500+ comentários (threshold viral). Focar em canais de nicho em vez de mega-influencers, comentários tendem a ser mais autênticos e detalhados em canais menores.

## Campos para Extrair

Extrair: text (o comentário), author (quem escreveu), publishedAt (quando), likeCount (para ordenação por relevância).

**NOVO - Métricas do vídeo fonte:** viewCount, commentCount, duration, title (para análise de formato).

Ignorar: replyCount, videoId, channelId, thumbnails. Não necessários para VOC.

## Filtros de Qualidade

Priorizar comentários com 20+ palavras, contêm mais substância. Descartar spam óbvio: "primeiro", "quem veio pelo...", emojis repetidos sem texto. Priorizar comentários com likes, indica validação social do sentimento.

---

## Output Obrigatório

Cada extração YouTube deve gerar:
1. Tabela de virais (10 vídeos com métricas)
2. 50 quotes de alta qualidade
3. Seção de análise de formato (padrões identificados)
