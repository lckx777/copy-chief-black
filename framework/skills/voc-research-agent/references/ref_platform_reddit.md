# Reddit Extraction

## Actor Principal

trudax/reddit-scraper-lite

Para busca por termo: searches (array de termos), searchPosts true, searchComments true, maxPostCount 20, maxComments 30, sort "new" ou "relevance" ou "hot" ou "top".

Para subreddit específico: startUrls com URL do subreddit, maxPostCount 30.

Para post específico: startUrls com URL do post, maxComments 100, skipCommunity true.

## Campos para Extrair

Extrair: body (texto do comentário ou post), author (username), created_utc (timestamp), score (upvotes para relevância).

## Subreddits Úteis por Nicho

Emagrecimento: r/loseit, r/intermittentfasting, r/keto, r/progresspics. Diabetes: r/diabetes, r/diabetes_t2. Fitness: r/fitness, r/bodyweightfitness, r/xxfitness. Relacionamento: r/relationship_advice, r/dating_advice. Ansiedade e saúde mental: r/anxiety, r/mentalhealth, r/depression. Finanças: r/personalfinance, r/investing, r/povertyfinance.

## Estratégia de Discovery

Executar web_search com "[tema] site:reddit.com" para encontrar posts relevantes. Identificar subreddits ativos do nicho. Posts com muitos comentários são fontes ricas de VOC.

## Notas Importantes

Reddit tem comentários mais longos e detalhados que outras plataformas, excelente para VOC. Usar proxy RESIDENTIAL para melhor taxa de sucesso. Sort por "top" retorna comentários mais validados pela comunidade. Reddit é especialmente bom para dores e frustrações genuínas porque usuários são anônimos.
