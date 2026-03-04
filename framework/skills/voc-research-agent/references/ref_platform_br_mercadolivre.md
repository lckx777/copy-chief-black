# Mercado Livre Extraction

Não há actor Apify dedicado confiável para Mercado Livre. Usar web_fetch + extração manual.

## Estratégia de Discovery

Executar web_search com "[produto concorrente] site:mercadolivre.com.br avaliações" ou "[produto] mercado livre opiniões" para encontrar páginas de produto com reviews.

## URL Patterns

Página de produto: mercadolivre.com.br/[produto-slug]/p/[ID] ou produto.mercadolivre.com.br/[produto-slug]

Seção de avaliações: geralmente na mesma página, scroll ou tab de "Opiniões"

## Campos para Extrair

texto_review: corpo da avaliação.

nota: 1-5 estrelas.

data: quando foi postada.

titulo: se disponível.

## Foco para VOC

Reviews 1-2 estrelas contêm dores e frustrações com produto/entrega. Reviews 5 estrelas contêm desejos realizados, linguagem de satisfação. Perguntas frequentes na página do produto revelam objeções e dúvidas comuns antes da compra.

## Exemplo de Output

Reviews Negativos (1-2 estrelas):
- "Não funcionou como prometido. Devolvi." (1 estrela, 2025-01-04)
- "Qualidade péssima, quebrou em 1 semana." (1 estrela, 2025-01-02)

Reviews Positivos (5 estrelas):
- "Finalmente algo que funciona! Recomendo." (5 estrelas, 2025-01-03)
- "Melhor investimento que fiz." (5 estrelas, 2025-01-01)

## Limitações

Extração mais lenta sem actor dedicado. Estrutura HTML pode mudar, verificar parsing se falhar. Usar como complemento de outras fontes, não como fonte principal.
