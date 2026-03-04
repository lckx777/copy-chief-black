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

YouTube: maxResults 5 vídeos por busca. Instagram: resultsLimit 30. TikTok: resultsPerPage 50, commentsPerPost 30. Reddit: maxPostCount 20, maxComments 30. Amazon: maxReviews 50 por produto.
