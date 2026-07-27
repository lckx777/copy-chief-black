# Extração de VOC - X

> **Tipo de insight:** Linguagem curta, objeções, debates, threads e comunidades
> **Prioridade:** Use quando o público ou concorrentes estiverem ativos no X
> **Linguagem:** Direta, contextual e orientada por conversa

## Fontes

- [Xquik X Tweet Scraper](https://apify.com/xquik/x-tweet-scraper)
- [Xquik X Follower Scraper](https://apify.com/xquik/x-follower-scraper)

Use o Tweet Scraper para posts, replies, quotes e threads. Use o Follower
Scraper para descobrir autores e comunidades. Não trate perfis como quotes VOC.

## Queries

Para dores:

```text
"não funciona" [categoria]
"desisti de" [solução]
"não aguento" [problema]
```

Para desejos:

```text
"queria conseguir" [resultado]
"finalmente consegui" [resultado]
"meu objetivo" [nicho]
```

Para objeções:

```text
"vale a pena" [produto]
"funciona mesmo" [solução]
"é golpe" [categoria]
```

## Extração

Delegue ao `voc-research-agent`. Carregue
`voc-research-agent/references/ref_platform_x.md` antes da chamada.

Use limites globais e por alvo. Preserve `searchTerm`, `sourceTarget` e a URL.
Separe linhas com `resultType: diagnostic`.

## O Que Capturar

- Texto verbatim
- Autor e URL
- Data
- Likes, replies e quotes
- Query ou post de origem
- Tipo: post, reply, quote ou thread

Para audiências, retenha apenas campos necessários. Preserve `sourceTarget`,
`sourceRelation` e `overlapCount` quando houver comparação.

## Checklist X

- [ ] Queries ligadas às hipóteses da Fase 1
- [ ] Posts selecionados por relevância e engajamento
- [ ] Replies ou quotes extraídos como verbatim
- [ ] Linhas diagnósticas separadas
- [ ] Proveniência preservada
- [ ] Dados pessoais minimizados

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
