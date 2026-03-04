# Protocolo PROCESS-SAVE-FORGET

## Por Que Este Protocolo Existe

Claude tem limite de aproximadamente 200K tokens de contexto. Extrações VOC podem gerar milhares de comentários. Sem este protocolo, context overflow causa perda de dados, respostas truncadas e erros de processamento. O protocolo mantém o contexto gerenciável processando incrementalmente.

## O Protocolo

PROCESS: carregar batch de 15 itens do dataset. Extrair apenas campos essenciais (texto, autor, data, url). Truncar textos longos em 400 caracteres para economizar tokens.

SAVE: fazer append ao arquivo .md de output. Confirmar que escrita foi bem-sucedida antes de prosseguir.

FORGET: não referenciar dados do batch anterior. Não manter dados brutos em contexto. Prosseguir para próximo batch com contexto limpo.

## Fluxo com Dataset de 180 Items

Dataset 180 items chega do Apify. Batch 1 processa items 1-15, salva, esquece. Batch 2 processa items 16-30, salva, esquece. Continua até batch 10 com items 136-150. Items 151-180 excedem limite de 150, aplicar sampling: selecionar 15 representativos, salvar, esquecer. Arquivo consolidado final tem 165 quotes.

## Sampling Estratificado

Quando dataset excede 150 items, selecionar amostra representativa dos excedentes. 30% por engajamento (top likes/replies). 30% por recência (mais recentes). 40% aleatório para diversidade. Isso garante representatividade sem processar tudo.

## Troubleshooting

Respostas ficando lentas indica acúmulo de contexto, salvar e limpar mais frequentemente. Erro "tool result too large" indica batch muito grande, reduzir para 10 itens. Dados duplicados no output indica que não está esquecendo batches corretamente. Qualidade degradando indica context overflow, fazer checkpoints mais frequentes.

## Boas Práticas

Criar arquivo de output no início, antes do primeiro batch. Usar append em vez de reescrita completa. Confirmar sucesso do save antes de esquecer o batch. Se erro no save, reter batch e fazer retry. Registrar progresso para debugging: "Batch 3/12 processado, 45 quotes salvos".
