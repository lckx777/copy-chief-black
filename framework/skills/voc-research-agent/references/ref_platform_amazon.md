# Amazon Extraction

## Actors Disponíveis

Para reviews de produto: junglee/amazon-reviews-scraper ou epctex/amazon-reviews-scraper. Input: productUrls (array de URLs de produtos), maxReviews 50 por produto.

Para busca de produtos: apify/amazon-crawler com keyword e país.

## Estratégia de Discovery

Executar web_search com "[produto/categoria] site:amazon.com.br reviews" ou "site:amazon.com" para encontrar produtos relevantes do nicho. Focar em produtos com 100+ reviews para volume adequado.

## Campos para Extrair

Extrair: reviewBody (texto da review), rating (1-5 estrelas), reviewDate, reviewerName, verifiedPurchase (importante para credibilidade).

## Foco de Extração para VOC

Reviews 1-2 estrelas contêm dores, frustrações e objeções. Reviews 4-5 estrelas contêm desejos realizados e linguagem positiva. Reviews 3 estrelas frequentemente têm comparações e expectativas não atendidas. Filtrar por verifiedPurchase true para reviews mais autênticas.

## Notas Importantes

Amazon BR (amazon.com.br) para mercado brasileiro, Amazon US (amazon.com) para referência internacional. Reviews de Amazon são especialmente valiosas para produtos físicos e suplementos. Linguagem tende a ser mais objetiva que redes sociais, foca em resultados concretos.
