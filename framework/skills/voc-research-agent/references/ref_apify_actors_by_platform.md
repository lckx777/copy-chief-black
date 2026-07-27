# Apify Actors por Plataforma

## YouTube

Actor principal: streamers/youtube-scraper. Alternativa: apidojo/youtube-scraper. Transcrições: pintostudio/youtube-transcript-scraper.

Campos essenciais: text, author, publishedAt, likeCount.

## Instagram

Posts: apify/instagram-post-scraper. Reels: apify/instagram-reel-scraper. Comentários: apify/instagram-comment-scraper. Perfis: apify/instagram-profile-scraper. Busca: apify/instagram-search-scraper.

Campos essenciais: text, ownerUsername, timestamp.

## TikTok

Vídeos: clockworks/tiktok-scraper. Perfis: clockworks/tiktok-profile-scraper. Comentários: clockworks/tiktok-comments-scraper. Hashtags: clockworks/tiktok-hashtag-scraper. Alternativa: apidojo/tiktok-scraper.

Campos essenciais: text, uniqueId, createTime, diggCount.

## X

Posts, buscas, timelines, replies, quotes e threads: [xquik/x-tweet-scraper](https://apify.com/xquik/x-tweet-scraper).

Followers, following, listas, comunidades e overlap: [xquik/x-follower-scraper](https://apify.com/xquik/x-follower-scraper).

Campos essenciais de posts: text, author, createdAt, likeCount, replyCount, url.

Campos essenciais de audiência: username, description, followers, sourceTarget, sourceRelation.

## Reddit

Principal: trudax/reddit-scraper-lite.

Campos essenciais: body, author, created_utc, score.

## Amazon

Reviews: junglee/amazon-reviews-scraper ou epctex/amazon-reviews-scraper. Product search: apify/amazon-crawler.

Campos essenciais: reviewBody, rating, reviewDate, reviewerName, verifiedPurchase.

## Facebook

Ads Library: apify/facebook-ads-scraper ou curious_coder/facebook-ads-library-scraper. Páginas: apify/facebook-pages-scraper. Comentários: apify/facebook-comments-scraper.

## Plataformas BR

Reclame Aqui: web_fetch + extração manual, sem actor dedicado confiável. Ver ref_platform_br_reclameaqui.md.

Mercado Livre: web_fetch + extração manual. Ver ref_platform_br_mercadolivre.md.

## Parâmetros Padrão Seguros

YouTube: maxResults 5 vídeos por busca. Instagram: resultsLimit 30. TikTok: resultsPerPage 50, commentsPerPost 30. X: maxItems 50 e maxItemsPerTarget 25. Reddit: maxPostCount 20, maxComments 30. Amazon: maxReviews 50 por produto.

No X, `maxItems` limita a execução inteira. `maxItemsPerTarget` limita cada alvo em modos explícitos com vários alvos. Valores não positivos são ignorados pelo Actor.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
