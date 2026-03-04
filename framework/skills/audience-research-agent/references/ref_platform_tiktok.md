# Extração de VOC - TikTok

> **Tipo de insight:** Linguagem geracional, dores não-filtradas, trends
> **Prioridade Brasil:** Alta
> **Linguagem:** Ultra-informal, gírias, humor, vulnerabilidade crua

---

## Por Que TikTok é Poderoso

- Linguagem MAIS CRUA de todas as plataformas
- Público mais jovem = menos filtro social
- "Storytime" revela experiências reais detalhadas
- Comentários brutalmente honestos
- Trends revelam dores/desejos coletivos
- Algoritmo surfacea conteúdo viral = validação massiva

---

## Queries de Busca (web_search)

### Estrutura Base
```
[tema] tiktok brasil
[problema] storytime tiktok
[nicho] viral tiktok
[termo do nicho] tiktok
```

### Por Tipo de Insight

**Para encontrar DORES CRUAS:**
```
[problema] storytime tiktok
[problema] a real tiktok
[problema] desabafo tiktok
"o que ninguém fala sobre" [tema] tiktok
```

**Para encontrar LINGUAGEM GERACIONAL:**
```
[nicho] tiktok viral brasil
[termo popular do nicho] tiktok
[gíria do nicho] tiktok
```

**Para encontrar TRENDS/DESEJOS:**
```
[resultado desejado] tiktok trend
[nicho] antes depois tiktok
[transformação] tiktok viral
```

### Exemplos por Nicho

**Emagrecimento:**
```
emagrecer storytime tiktok
dieta a real tiktok
ozempic tiktok brasil
"não consigo emagrecer" tiktok
```

**Finanças (público jovem):**
```
dívida storytime tiktok
primeiro salário tiktok
renda extra tiktok brasil
"estou quebrado" tiktok
```

**Relacionamento:**
```
término storytime tiktok
red flag relacionamento tiktok
"meu ex" tiktok viral
dating app tiktok brasil
```

**Saúde Mental:**
```
ansiedade storytime tiktok
burnout tiktok brasil
terapia tiktok
```

**Carreira:**
```
demissão storytime tiktok
primeiro emprego tiktok
"odeio meu trabalho" tiktok
entrevista de emprego tiktok
```

---

## O Que Extrair dos Resultados

### 1. Identificar Vídeos Relevantes
Priorize:
- Vídeos com milhões de views (validação massiva)
- Storytimes detalhados
- Vídeos com milhares de comentários
- Trends específicos do nicho
- Conteúdo de creators BR

### 2. Usar web_fetch
Extraia:

**Dos VÍDEOS:**
- Narrativa/história contada
- Ganchos usados (primeiros 3 segundos)
- Linguagem e gírias específicas
- Emoção dominante

**Dos COMENTÁRIOS:**
- "Eu também" (validação de dor comum)
- Histórias adicionais nos comentários
- Perguntas e objeções
- Humor autodepreciativo (revela dor real)

### 3. Template de Captura

```yaml
fonte: TikTok
video_descricao: "[descrição breve]"
video_url: "[URL se disponível]"
views: [número]
creator: "@[username]"

quote: "[texto exato com gírias]"
tipo: [dor|desejo|humor|validação|pergunta]
contexto: [storytime|comentário|trend]
linguagem_geracional: [gírias específicas usadas]
emoção: [desespero|humor_negro|esperança|raiva]
confidence: [alto|médio|baixo]
```

---

## Padrões de Linguagem TikTok (BR)

### Gírias e Expressões Comuns
- "surto" = momento de crise/frustração
- "eu literalmente" = ênfase emocional
- "não tanko" = não aguento
- "é sobre isso" = identificação
- "gente???" = incredulidade/desespero
- "chorando" = afetado emocionalmente (positivo ou negativo)
- "ok mas" = objeção vindo
- "pov:" = point of view, experiência pessoal

### Indicadores de Dor Real
- "storytime de quando..."
- "a real sobre..."
- "o que ninguém te conta..."
- "eu achando que era só comigo"
- "gente eu não aguento mais"
- Humor autodepreciativo sobre o problema

### Indicadores de Desejo
- "quando eu finalmente..."
- "minha era de..."
- "esse vai ser meu ano de..."
- "manifestando..."
- "eu PRECISO"

### Indicadores de Objeção/Ceticismo
- "mas tipo..."
- "tá mas e quem..."
- "gente será que funciona?"
- "eu caí nessa uma vez"

---

## Tipos de Conteúdo para Priorizar

### 1. Storytimes
Vídeos narrativos contando experiências pessoais
- **VOC:** Histórias detalhadas, linguagem emocional, contexto completo

### 2. "A Real Sobre..."
Conteúdo que desmistifica ou revela verdades incômodas
- **VOC:** Frustrações com soluções existentes, objeções

### 3. Trends de Identificação
Trends onde pessoas mostram situações do dia-a-dia
- **VOC:** Dores normalizadas, linguagem natural

### 4. Antes/Depois e Transformações
- **VOC:** Desejos, resultados esperados, timeline

### 5. Comentários em Vídeos Virais
Às vezes mais valiosos que o próprio vídeo
- **VOC:** Validação massiva de dores/desejos

---

## Diferenças Demográficas no TikTok

### Gen Z (18-25)
- Mais humor autodepreciativo
- Gírias mais intensas
- Vulnerabilidade como norma
- Foco em saúde mental

### Millennials (26-40)
- Storytimes mais estruturados
- Foco em carreira/finanças
- Tom mais reflexivo
- Comparação com expectativas

### Pais no TikTok
- Conteúdo sobre maternidade/paternidade real
- Vulnerabilidade sobre dificuldades
- Menos filtro que Instagram

---

## Checklist TikTok

- [ ] Trends atuais do nicho identificados
- [ ] Mínimo 5 vídeos virais analisados
- [ ] Mínimo 10 quotes verbatim extraídos
- [ ] Gírias/linguagem geracional catalogadas
- [ ] Storytimes relevantes mapeados
- [ ] Padrões de humor/vulnerabilidade identificados
