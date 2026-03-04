# Extração de VOC - YouTube

> **Tipo de insight:** Dores profundas, objeções, histórias de fracasso
> **Prioridade Brasil:** Alta
> **Linguagem:** Informal, emocional, detalhada

---

## Por Que YouTube é Ouro

- Comentários em vídeos de experts atraem público QUALIFICADO
- Perguntas revelam gaps de conhecimento reais
- Histórias pessoais aparecem espontaneamente
- Público brasileiro muito ativo em comentários

---

## Queries de Busca (web_search)

### Estrutura Base
```
[nicho] youtube comentários
[expert do nicho] youtube
[problema] depoimento youtube
[solução] funciona youtube
```

### Por Tipo de Insight

**Para encontrar DORES:**
```
[problema] não consigo youtube
[problema] ajuda youtube
[problema] desabafo youtube
minha história [problema] youtube
```

**Para encontrar OBJEÇÕES:**
```
[solução] funciona mesmo youtube
[solução] vale a pena youtube
[produto/método] é golpe youtube
[solução] verdade youtube
```

**Para encontrar DESEJOS:**
```
[solução] resultado youtube
[solução] antes depois youtube
consegui [resultado] youtube
como [resultado] depoimento
```

### Exemplos por Nicho

**Emagrecimento:**
```
emagrecer não consigo youtube
dieta low carb funciona youtube
ozempic vale a pena youtube
perdi 20kg depoimento youtube
```

**Finanças:**
```
sair das dívidas youtube
day trade funciona youtube
renda extra 2024 youtube
investir pouco dinheiro youtube
```

**Relacionamento:**
```
reconquistar ex youtube
casamento em crise youtube
terapia de casal funciona youtube
```

**Saúde Masculina:**
```
disfunção erétil tratamento youtube
testosterona baixa youtube
calvície tratamento youtube
```

---

## O Que Extrair dos Resultados

### 1. Identificar Vídeos Relevantes
Após web_search, priorize vídeos com:
- Títulos que indicam depoimento/experiência pessoal
- Alto número de visualizações (validação social)
- Vídeos de experts reconhecidos no nicho BR
- Vídeos recentes (últimos 12 meses)

### 2. Usar web_fetch na Página do Vídeo
Extraia dos comentários:

**Comentários de ALTO VALOR (priorizar):**
- Comentários longos (investimento emocional)
- Comentários com muitos likes
- Comentários que contam histórias pessoais
- Comentários que fazem perguntas específicas
- Threads de discussão (controvérsia = dor)

**Sinais de linguagem a capturar:**
- Frases que começam com "Eu também..."
- Perguntas tipo "Mas e se..."
- Desabafos tipo "Já tentei de tudo..."
- Relatos tipo "Comigo funcionou/não funcionou porque..."

### 3. Template de Captura

```yaml
fonte: YouTube
video_titulo: "[título do vídeo]"
video_url: "[URL]"
video_views: [número]
canal: "[nome do canal]"

quote: "[comentário exato, com erros de digitação]"
likes_comentario: [número se visível]
tipo: [dor|desejo|objeção|pergunta|história]
emoção: [frustração|esperança|desespero|raiva|curiosidade]
contexto_autor: "[o que sabemos sobre quem comentou]"
confidence: [alto|médio|baixo]
```

---

## Experts/Canais para Mapear por Nicho

Ao iniciar pesquisa, identifique os 3-5 maiores canais do nicho no BR:

**Como encontrar:**
```
web_search("[nicho] canal youtube brasil")
web_search("[nicho] youtuber brasileiro")
web_search("melhor canal [nicho] youtube")
```

**Depois, busque vídeos específicos desses canais:**
```
web_search("[nome do canal] [tema específico]")
```

---

## Padrões de Comentários por Tipo

### Dores (Capturar VERBATIM)
- "Gente, eu estou desesperada..."
- "Alguém mais passa por isso?"
- "Já gastei tanto dinheiro com isso e nada..."
- "Meu [relacionamento/saúde/etc] está destruído por causa disso"
- "Tenho vergonha de admitir mas..."

### Objeções (Capturar VERBATIM)
- "Será que funciona pra quem tem [condição específica]?"
- "Mas e quem não tem tempo/dinheiro?"
- "Já vi tanta coisa que não funciona..."
- "Parece bom demais pra ser verdade"
- "E os efeitos colaterais?"

### Desejos (Capturar VERBATIM)
- "Meu sonho é conseguir..."
- "Se eu conseguisse isso minha vida mudaria"
- "Queria tanto ter essa disposição/resultado/etc"
- "Imagina acordar e..."

### Perguntas Reveladoras (Capturar VERBATIM)
- "Funciona pra quem...?"
- "Quanto tempo demora pra...?"
- "Pode fazer junto com...?"
- "E se eu tiver...?"

---

## Checklist YouTube

- [ ] 3-5 experts/canais do nicho identificados
- [ ] Mínimo 5 vídeos relevantes analisados
- [ ] Mínimo 15 quotes verbatim extraídos
- [ ] Quotes categorizados por tipo
- [ ] Perguntas frequentes mapeadas
- [ ] Objeções recorrentes identificadas
