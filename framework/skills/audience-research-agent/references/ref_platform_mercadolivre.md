# Extração de VOC - Mercado Livre

> **Tipo de insight:** Objeções de compra, expectativas, comparações
> **Prioridade Brasil:** Alta (produtos físicos)
> **Linguagem:** Direta, focada em resultado, comparativa

---

## Por Que Mercado Livre é Essencial (BR)

- Maior marketplace da América Latina
- Seção de PERGUNTAS revela objeções PRÉ-compra
- Avaliações revelam expectativas vs realidade
- Público brasileiro real, linguagem natural
- Comparações explícitas com concorrentes
- Contexto de uso detalhado nas avaliações

---

## Queries de Busca (web_search)

### Estrutura Base
```
[produto] mercado livre avaliações
[produto] mercado livre opiniões
[categoria] mercado livre brasil
[produto concorrente] mercado livre
```

### Por Tipo de Insight

**Para encontrar OBJEÇÕES:**
```
[produto] mercado livre perguntas
[produto] vale a pena mercado livre
[produto] funciona mercado livre
```

**Para encontrar EXPECTATIVAS:**
```
[produto] avaliação mercado livre
[produto] review mercado livre brasil
[produto] opinião compradores mercado livre
```

**Para encontrar COMPARAÇÕES:**
```
[produto A] vs [produto B] mercado livre
melhor [categoria] mercado livre
[produto] original mercado livre
```

### Exemplos por Nicho

**Suplementos/Saúde:**
```
whey protein mercado livre avaliações
vitamina D mercado livre opiniões
suplemento emagrecimento mercado livre
```

**Eletrônicos:**
```
[produto específico] mercado livre review
[marca] vale a pena mercado livre
```

**Beleza/Estética:**
```
sérum vitamina c mercado livre avaliações
dermapen mercado livre opiniões
minoxidil mercado livre
```

**Fitness:**
```
[equipamento] mercado livre avaliações
cinta modeladora mercado livre opiniões
```

---

## O Que Extrair dos Resultados

### 1. Seção de PERGUNTAS (Pré-compra)

**Esta é OURO para objeções!**

As perguntas revelam:
- Dúvidas antes de comprar (objeções reais)
- Medos sobre o produto
- Comparações que fazem
- Critérios de decisão

**Padrões de pergunta a capturar:**
- "Funciona para [condição específica]?"
- "É original?"
- "Quanto tempo dura?"
- "Tem garantia?"
- "Qual a diferença para [concorrente]?"
- "Serve para [uso específico]?"

### 2. Avaliações NEGATIVAS (1-3 estrelas)

**Prioridade máxima para dores:**
- Expectativas não atendidas
- Problemas de uso
- Comparações desfavoráveis
- Frustrações com o produto

**Padrões a capturar:**
- "Achei que ia [expectativa], mas..."
- "Não funciona para..."
- "O [concorrente] é melhor porque..."
- "Dinheiro jogado fora"
- "Propaganda enganosa"

### 3. Avaliações POSITIVAS (5 estrelas)

**Para entender desejos realizados:**
- O que amaram
- Resultados obtidos
- Como usaram
- Comparações favoráveis

**Padrões a capturar:**
- "Finalmente encontrei..."
- "Muito melhor que [concorrente]..."
- "Resolveu meu problema de..."
- "Superou expectativas"

### 4. Template de Captura

```yaml
fonte: Mercado Livre
produto: "[nome do produto]"
produto_url: "[URL]"
vendedor: "[nome]"
preco_aproximado: "[R$]"

# Se for PERGUNTA:
tipo_conteudo: pergunta
pergunta: "[pergunta exata]"
resposta_vendedor: "[resposta se houver]"
insight_tipo: [objeção|dúvida|comparação|uso_específico]

# Se for AVALIAÇÃO:
tipo_conteudo: avaliação
estrelas: [1-5]
titulo_avaliacao: "[título se houver]"
texto_avaliacao: "[texto completo]"
insight_tipo: [expectativa_frustrada|resultado_positivo|comparação|problema_uso]

emoção: [frustração|satisfação|surpresa|decepção]
confidence: [alto|médio|baixo]
```

---

## Estratégia de Busca por Tipo de Produto

### Produtos do Seu Cliente
1. Busque o produto exato
2. Analise TODAS as perguntas
3. Leia avaliações 1-3 estrelas primeiro
4. Depois avaliações 5 estrelas

### Produtos Concorrentes
1. Identifique 3-5 concorrentes diretos
2. Foque em avaliações negativas (dores não resolvidas)
3. Compare padrões de reclamação

### Produtos Complementares
1. Produtos que o público também compra
2. Revela outros problemas/desejos do mesmo público

---

## Padrões de Linguagem Mercado Livre

### Objeções Comuns (Perguntas)
- "É original ou réplica?"
- "Funciona mesmo ou é enganação?"
- "Serve pra quem tem [condição]?"
- "Demora quanto tempo pra fazer efeito?"
- "Tem contraindicação?"
- "Posso usar junto com [outro produto]?"
- "Vem com nota fiscal?"
- "Se não funcionar posso devolver?"

### Frustrações (Avaliações Negativas)
- "Não vi resultado nenhum"
- "Achei que ia ser diferente"
- "Pela foto parecia maior/melhor"
- "Muito caro pelo que entrega"
- "Demorou muito pra chegar e veio errado"
- "Produto veio com defeito"
- "Vendedor não responde"

### Satisfação (Avaliações Positivas)
- "Superou minhas expectativas"
- "Entrega rápida e produto excelente"
- "Já é minha segunda compra"
- "Recomendo muito"
- "Finalmente achei um que funciona"
- "Melhor custo-benefício"

---

## Análise de Concorrentes via ML

### Mapeamento de Mercado
1. Busque a categoria principal
2. Identifique os 5 produtos mais vendidos
3. Para cada um, analise:
   - Perguntas mais frequentes
   - Reclamações recorrentes
   - Elogios recorrentes

### Identificar Gaps de Mercado
Compare avaliações negativas dos concorrentes:
- Que problemas NINGUÉM resolve bem?
- Que expectativa é sempre frustrada?
- Que feature todo mundo pede?

---

## Checklist Mercado Livre

- [ ] Produto principal analisado (perguntas + avaliações)
- [ ] 3-5 concorrentes mapeados
- [ ] Mínimo 20 perguntas capturadas
- [ ] Mínimo 15 avaliações analisadas (mix de estrelas)
- [ ] Objeções pré-compra catalogadas
- [ ] Expectativas vs realidade mapeadas
- [ ] Padrões de reclamação identificados
