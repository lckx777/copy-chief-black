# Instagram Extraction

## IMPORTANTE: Tool Priority
**SEMPRE usar Apify para extração de Instagram. WebSearch é ÚLTIMO RESORT.**

Ordem obrigatória:
1. Apify actors (5min timeout)
2. Playwright direto se Apify falha
3. Firecrawl se Playwright falha
4. WebSearch APENAS se tudo falha

**NUNCA pular direto para WebSearch.**

---

## Actors Disponíveis

Para comentários de posts/reels específicos: apify/instagram-comment-scraper com directUrls (array de URLs de posts ou reels), resultsLimit 50 por post, includeNestedComments true para capturar replies.

Para posts de um perfil: apify/instagram-post-scraper com username e resultsLimit 30.

Para busca por hashtag ou local: apify/instagram-hashtag-scraper com hashtags (array), resultsLimit 50.

Alternativa para search: apify/instagram-search-scraper com search (termo), searchType ("hashtag", "place" ou "user"), searchLimit 10.

---

## Viral-First Strategy (OBRIGATÓRIO)

### Passo 1: Discovery de Virais via Hashtag
**USAR hashtag-scraper PRIMEIRO para descobrir conteúdo viral:**
- Actor: `apify/instagram-hashtag-scraper`
- Hashtags relevantes ao nicho
- Sort by: engagement (likesCount + commentsCount)
- Threshold mínimo: **5K+ likes OU 200+ comments**

### Passo 2: Registrar Métricas
Para cada post viral, capturar:
- likesCount
- commentsCount
- type (Image/Video/Carousel/Reel)
- timestamp

### Passo 3: Análise de Formato
Registrar para cada viral:
- **Tipo:** carrossel / reel / estático / stories
- **Tema:** meme / dica / desabafo / motivacional / tutorial
- **Estilo visual:** clean / meme / screenshot / UGC
- **Caption hook:** primeiras 2 linhas
- **Hashtags usadas:** top 5

### Passo 4: Extrair Comentários dos Top 10
- Actor: `apify/instagram-comment-scraper`
- directUrls: URLs dos 10 posts mais engajados
- resultsLimit: 5 por post (mais curtidos)
- Target: 50 comments de alta qualidade

---

## Estratégia de Discovery

**Workflow em 2 etapas:**
1. Usar `apify/instagram-hashtag-scraper` com hashtags do nicho
2. Ordenar resultados por engagement
3. Selecionar top 10 posts virais
4. Usar `apify/instagram-comment-scraper` nos selecionados

Focar em posts com alto engajamento (muitos comentários). Reels tendem a ter mais comentários autênticos que posts estáticos de imagem.

## Campos para Extrair

Extrair: text (comentário), ownerUsername (autor), timestamp (data), likesCount (para priorização).

**NOVO - Métricas do post fonte:** likesCount, commentsCount, type, caption (para análise de formato).

## Notas Importantes

Instagram é mais restritivo que outras plataformas, usar limites menores. Comentários tendem a ser mais curtos que YouTube, compensar com mais fontes. Verificar se conta é pública antes de tentar extrair, contas privadas não retornam dados.

---

## Output Obrigatório

Cada extração Instagram deve gerar:
1. Tabela de virais (10 posts com métricas)
2. 50 quotes de alta qualidade
3. Seção de análise de formato (tipo, tema, estilo, hooks)
