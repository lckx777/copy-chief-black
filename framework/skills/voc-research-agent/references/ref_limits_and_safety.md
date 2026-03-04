# Limites e Configurações de Segurança

## Limites Seguros

Batch size: 15 itens é o limite seguro, máximo 20. Acima disso o contexto fica sobrecarregado e qualidade degrada.

Quote length: 400 caracteres é o limite seguro, máximo 500. Quotes mais longos desperdiçam tokens sem adicionar valor proporcional.

URLs por query: 5 é o limite seguro, máximo 10. Mais URLs aumentam timeout e custo sem ganho proporcional de dados.

Quotes totais: 150 é o limite seguro, máximo 200. Acima disso aplicar sampling. Processamento fica muito lento com volumes maiores.

Queries paralelas: 5 é o limite seguro, máximo 10. Rate limiting pode ocorrer com muitas requisições simultâneas.

## Campos Essenciais por Plataforma

YouTube: text (comentário), author, publishedAt, likeCount (para ordenação por relevância).

Instagram: text, ownerUsername, timestamp.

TikTok: text, uniqueId (autor), createTime, diggCount (likes).

Reddit: body, author, created_utc, score.

Amazon: reviewBody, rating, reviewDate, reviewerName, verifiedPurchase.

Plataformas BR: titulo, texto, autor (se disponível), data, status (para Reclame Aqui).

Ignorar campos não-essenciais para economizar tokens e processamento.

## Timeouts Recomendados

YouTube: 120 segundos. Instagram: 180 segundos (mais restritivo). TikTok: 120 segundos. Reddit: 90 segundos. Amazon: 120 segundos. Web fetch para plataformas BR: 30 segundos.

## Rate Limits

Se receber erro de rate limit: aguardar 60 segundos, fazer retry com limite reduzido. Se persistir, documentar o problema e prosseguir com dados parciais já coletados. Não insistir indefinidamente.

## Custos Aproximados Apify

YouTube aproximadamente $0.50 por 1000 results. Instagram aproximadamente $1.00 por 1000 (mais caro por restrições). TikTok $0.30-0.75 por 1000. Reddit $0.50 por 1000. Amazon $0.50-1.00 por 1000. Otimizar solicitando apenas campos necessários reduz custo.
