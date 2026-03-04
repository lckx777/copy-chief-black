# Extração de VOC - Reddit

> **Tipo de insight:** Discussões profundas, linguagem sem filtro, histórias detalhadas
> **Prioridade Brasil:** Média (menos usado no BR, mas valioso para nichos específicos)
> **Linguagem:** Informal, detalhada, anônima = honesta

---

## Por Que Reddit é Valioso

- Anonimato = honestidade brutal
- Posts longos = contexto rico
- Upvotes = validação social do sentimento
- Subreddits = segmentação por interesse
- Discussões aprofundadas

**Limitação BR:** Reddit tem menos penetração no Brasil, mas é valioso para:
- Nichos de tecnologia
- Gaming
- Finanças/investimentos
- Comunidades de expatriados
- Nichos com público que fala inglês

---

## Queries de Busca (web_search)

### Estrutura Base
```
[problema] reddit brasil
[nicho] reddit desabafo
r/brasil [tema]
[problema] help reddit
```

### Subreddits Brasileiros Relevantes

**Gerais:**
- r/brasil
- r/desabafos
- r/conversas
- r/perguntereddit

**Finanças:**
- r/investimentos
- r/farialimabets
- r/financaspessoaispt

**Tecnologia:**
- r/brdev
- r/programacao

**Relacionamento:**
- r/relacionamentos
- r/sexualidade

### Por Tipo de Insight

**Para DORES:**
```
[problema] reddit desabafo
[problema] ajuda reddit brasil
"não aguento mais" [tema] reddit
[problema] alguém mais reddit
```

**Para SOLUÇÕES TENTADAS:**
```
[solução] funciona reddit
[solução] experiência reddit
[solução] vale a pena reddit brasil
já tentei [solução] reddit
```

---

## O Que Extrair

### Posts de Alto Valor
- Posts com muitos upvotes
- Posts com muitos comentários
- Posts em subreddits de desabafo
- Threads de discussão longas

### Template de Captura

```yaml
fonte: Reddit
subreddit: "r/[nome]"
post_url: "[URL]"
upvotes: [número]
comentarios: [número]

titulo_post: "[título]"
conteudo_relevante: "[trecho ou resumo]"
quote_verbatim: "[frase exata]"

tipo: [dor|solução_tentada|pergunta|história]
emoção: [frustração|esperança|desespero|curiosidade]
confidence: [alto|médio|baixo]
```

---

## Padrões de Linguagem Reddit BR

### Indicadores de Dor
- "Preciso desabafar..."
- "Alguém mais passa por isso?"
- "Não sei mais o que fazer"
- "To no fundo do poço"
- "Isso tá acabando comigo"

### Indicadores de Busca por Solução
- "Alguém já tentou...?"
- "Vale a pena...?"
- "Funciona mesmo...?"
- "Qual a experiência de vocês com...?"

---

## Checklist Reddit

- [ ] Subreddits relevantes identificados
- [ ] Mínimo 5 posts analisados
- [ ] Mínimo 10 quotes verbatim
- [ ] Padrões de discussão mapeados
