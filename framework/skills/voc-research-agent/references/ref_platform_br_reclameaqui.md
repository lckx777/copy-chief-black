# Reclame Aqui Extraction

Não há actor Apify dedicado confiável para Reclame Aqui. Usar web_fetch + extração manual.

## Estratégia de Discovery

Executar web_search com "[nome do concorrente] site:reclameaqui.com.br" para descobrir página da empresa.

## URL Patterns

Página da empresa: reclameaqui.com.br/empresa/[slug]/

Lista de reclamações: reclameaqui.com.br/empresa/[slug]/lista-reclamacoes/

Reclamação específica: reclameaqui.com.br/[slug-empresa]/[titulo-reclamacao]/[id]/

## Campos para Extrair

titulo_reclamacao: headline emocional, frequentemente contém linguagem de frustração concentrada.

texto_reclamacao: corpo da queixa, truncar em 400 chars.

status: resolvido, nao_resolvido, nao_respondida. Não resolvidas têm frustração máxima.

data: quando foi postada.

nota_consumidor: se disponível após resolução.

## Foco para VOC

Priorizar reclamações NÃO RESOLVIDAS, contêm frustração máxima e linguagem emocional autêntica. Títulos das reclamações são especialmente valiosos, condensam a dor em uma frase. Analisar respostas da empresa para identificar gaps de atendimento e objeções comuns.

## Exemplo de Extração

web_fetch da página de reclamações, parsear HTML para extrair lista. Para cada reclamação relevante, extrair campos. Formato de output:

"PRODUTO NÃO FUNCIONA E NINGUÉM RESOLVE" (não resolvido, 2025-01-05): "Comprei o produto há 3 meses e até hoje não consegui usar..." - @usuario
