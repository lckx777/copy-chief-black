# Extração de VOC - Instagram

> **Tipo de insight:** Desejos aspiracionais, linguagem curta, social proof
> **Prioridade Brasil:** Alta
> **Linguagem:** Curta, emocional, emojis, aspiracional

---

## Por Que Instagram é Valioso

- Comentários em posts de autoridades revelam aspirações
- Linguagem mais curta = essência do desejo/dor
- Público BR extremamente ativo
- Stories e Reels geram engajamento emocional alto
- Comparação social evidente nos comentários

---

## Queries de Busca (web_search)

### Estrutura Base
```
[expert do nicho] instagram
@[username] [tema]
[nicho] instagram brasil
[resultado] antes depois instagram
```

### Por Tipo de Insight

**Para encontrar DESEJOS:**
```
[resultado] transformação instagram
[nicho] antes depois instagram
[expert] resultado alunos instagram
```

**Para encontrar DORES:**
```
[problema] instagram desabafo
[problema] ajuda instagram
[nicho] dificuldade instagram
```

**Para encontrar PROVA SOCIAL:**
```
[expert] depoimento alunos instagram
[método/produto] resultado instagram
[nicho] casos sucesso instagram
```

### Exemplos por Nicho

**Emagrecimento:**
```
@[nutricionista famosa] emagrecimento
emagrecimento antes depois instagram brasil
nutricionista instagram resultado
```

**Finanças:**
```
@[educador financeiro] investimentos
renda extra instagram brasil
liberdade financeira instagram
```

**Negócios/Marketing:**
```
@[mentor de negócios] instagram
empreendedor digital instagram brasil
faturamento instagram depoimento
```

**Estética/Beleza:**
```
harmonização facial antes depois instagram
skincare rotina instagram brasil
```

---

## O Que Extrair dos Resultados

### 1. Identificar Perfis Relevantes
Após web_search, priorize:
- Experts/autoridades do nicho com 50k+ seguidores
- Posts com alto engajamento (muitos comentários)
- Posts de "antes e depois" ou transformação
- Posts que geram controvérsia/debate
- Carrosséis educativos com muitas salvamentos

### 2. Usar web_fetch
Extraia dos comentários:

**Comentários de ALTO VALOR:**
- Perguntas diretas sobre o método/produto
- Relatos pessoais ("comigo também...")
- Marcações de amigos (indica ressonância)
- Comentários com muitos likes
- Respostas do expert (revela objeções comuns)

**Padrões específicos do Instagram:**
- Uso de emojis () indica emoção
- "Me conta mais" = interesse genuíno
- "Preciso disso" = desejo declarado
- Marcações = validação social

### 3. Template de Captura

```yaml
fonte: Instagram
perfil: "@[username]"
perfil_seguidores: [número aproximado]
post_tipo: [foto|carrossel|reels|story]
post_tema: "[descrição breve]"
post_url: "[URL se disponível]"

quote: "[comentário exato com emojis]"
likes_comentario: [número se visível]
tipo: [dor|desejo|pergunta|validação]
emoção: [aspiração|frustração|curiosidade|entusiasmo]
confidence: [alto|médio|baixo]
```

---

## Autoridades para Mapear por Nicho

**Como encontrar experts do nicho:**
```
web_search("[nicho] influencer instagram brasil")
web_search("[nicho] especialista instagram")
web_search("melhor [profissão do nicho] instagram")
```

**Critérios de seleção:**
- Engajamento real (não só seguidores)
- Comentários genuínos (não só emojis)
- Conteúdo educativo (não só lifestyle)
- Público brasileiro

---

## Padrões de Comentários Instagram

### Desejos (linguagem curta, aspiracional)
- "😍 quero muito"
- "meu sonho "
- "um dia chego lá"
- "meta"
- "isso é tudo que eu queria"
- "preciso disso na minha vida"

### Dores (vulnerabilidade rápida)
- "😢 eu sofro tanto com isso"
- "ninguém entende"
- "tô precisando"
- "me ajuda "
- "não sei mais o que fazer"

### Perguntas (objeções disfarçadas)
- "funciona pra quem [condição]?"
- "quanto tempo demora?"
- "tem efeito colateral?"
- "é caro?"
- "onde compro/faço?"

### Validação Social (prova de ressonância)
- "@amiga olha isso"
- "vim pelo stories"
- "melhor conteúdo"
- "[emoji de palmas] finalmente alguém falando sobre isso"

---

## Tipos de Posts para Priorizar

### 1. Posts de Transformação
- Antes/depois
- "Minha história"
- Depoimentos de clientes/alunos
- **VOC:** Comentários revelam desejos aspiracionais

### 2. Posts Educativos Controversos
- "O que ninguém te conta sobre..."
- "Pare de fazer isso..."
- Mitos desmascarados
- **VOC:** Comentários revelam crenças limitantes

### 3. Posts de Bastidores/Vulnerabilidade
- Fracassos do expert
- Processo real
- Dificuldades enfrentadas
- **VOC:** Comentários revelam identificação e dores similares

### 4. Posts de Oferta/Lançamento
- Abertura de turma
- Produto novo
- Promoção
- **VOC:** Comentários revelam objeções diretas

---

## Checklist Instagram

- [ ] 3-5 autoridades do nicho identificadas
- [ ] Mínimo 10 posts relevantes analisados
- [ ] Mínimo 10 quotes verbatim extraídos
- [ ] Linguagem aspiracional mapeada
- [ ] Perguntas frequentes identificadas
- [ ] Emojis/padrões de expressão catalogados
