# TikTok Extraction

## IMPORTANTE: Tool Priority
**SEMPRE usar Apify para extração de TikTok. WebSearch é ÚLTIMO RESORT.**

Ordem obrigatória:
1. Apify actors clockworks/* (5min timeout)
2. Playwright direto se Apify falha
3. Firecrawl se Playwright falha
4. WebSearch APENAS se tudo falha

**NUNCA pular direto para WebSearch.**

---

## Actors Disponíveis

Para vídeos por hashtag: clockworks/tiktok-hashtag-scraper com hashtags (array), resultsPerPage 50.

Para comentários de vídeos específicos: clockworks/tiktok-comments-scraper com postURLs (array de URLs), commentsPerPost 50.

Para busca por termo: clockworks/tiktok-scraper com searchQueries (array), resultsPerPage 30, searchSection "/video" para focar em vídeos.

Para posts de perfil: clockworks/tiktok-profile-scraper com profiles (array de usernames sem @), resultsPerPage 50.

Alternativa geral: apidojo/tiktok-scraper.

---

## Viral-First Strategy (OBRIGATÓRIO)

### Passo 1: Discovery de Virais via Hashtag/Search
**USAR scraper PRIMEIRO para descobrir conteúdo viral:**
- Actor: `clockworks/tiktok-scraper` ou `clockworks/tiktok-hashtag-scraper`
- Sort by: playCount (views)
- Threshold mínimo: **50K+ views OU 1K+ comments**

### Passo 2: Registrar Métricas
Para cada vídeo viral, capturar:
- playCount (views)
- commentCount
- diggCount (likes)
- shareCount
- duration
- **musicTitle** (som/música usado)

### Passo 3: Análise de Formato (CRÍTICO para TikTok)
Registrar para cada viral:
- **Som/música:** trending sound? nome do áudio
- **Duração:** <15s / 15-60s / >60s
- **Formato:** POV / storytime / duet / stitch / tutorial / meme / desabafo
- **Hook 3 segundos:** o que acontece nos primeiros 3seg
- **Hashtags:** combinação usada
- **Engagement rate:** (likes+comments+shares)/views

### Passo 4: Extrair Comentários dos Top 10
- Actor: `clockworks/tiktok-comments-scraper`
- postURLs: URLs dos 10 vídeos mais engajados
- commentsPerPost: 5 (mais curtidos)
- Target: 50 comments de alta qualidade

---

## Estratégia de Discovery

**Workflow em 2 etapas:**
1. Usar `clockworks/tiktok-scraper` ou `clockworks/tiktok-hashtag-scraper`
2. Ordenar por playCount (views)
3. Selecionar top 10 vídeos virais
4. Usar `clockworks/tiktok-comments-scraper` nos selecionados

Hashtags são muito eficientes para descobrir conteúdo de nicho no TikTok.

## Campos para Extrair

Extrair: text (comentário), uniqueId (autor), createTime (timestamp), diggCount (likes para relevância).

**NOVO - Métricas do vídeo fonte:** playCount, commentCount, diggCount, shareCount, duration, musicTitle (para análise de formato).

## Notas Importantes

TikTok é uma das plataformas mais baratas para scraping. Comentários tendem a ser mais curtos que YouTube, compensar com volume maior. Verificar se proxy country está configurado corretamente se houver problemas de acesso.

**Capturar som/música é CRÍTICO** - tendências de TikTok são frequentemente baseadas em trending sounds.

---

## Output Obrigatório

Cada extração TikTok deve gerar:
1. Tabela de virais (10 vídeos com métricas + som)
2. 50 quotes de alta qualidade
3. Seção de análise de formato (som, duração, formato, hooks 3seg)
4. Lista de trending sounds identificados
