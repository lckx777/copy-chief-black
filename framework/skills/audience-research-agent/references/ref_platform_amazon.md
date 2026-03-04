# Extração de VOC - Amazon Brasil

> **Tipo de insight:** Objeções estruturadas, expectativas, comparações
> **Prioridade Brasil:** Média
> **Linguagem:** Estruturada, focada em resultado

---

## Por Que Amazon BR é Útil

- Reviews estruturados por estrelas
- Seção "O que os clientes dizem" resume padrões
- Perguntas e respostas revelam objeções
- Livros do nicho = público qualificado
- Produtos complementares = contexto expandido

---

## Queries de Busca (web_search)

### Estrutura Base
```
[produto] amazon brasil avaliações
[livro do nicho] amazon review
[categoria] amazon brasil opiniões
```

### O Que Buscar

**Livros sobre o problema/solução:**
- Reviews revelam se o conteúdo ajudou
- Perguntas revelam dúvidas do público

**Produtos relacionados:**
- Suplementos, equipamentos, ferramentas
- Reviews de 1-3 estrelas = frustrações

---

## O Que Extrair

### Reviews por Estrelas

**1-2 estrelas (PRIORIDADE):**
- Expectativas não atendidas
- "Achei que ia..."
- "Não funcionou para mim porque..."
- Comparações negativas

**3 estrelas:**
- Pontos positivos E negativos
- "É bom, mas..."
- Gaps identificados

**5 estrelas:**
- O que amaram
- Resultados obtidos
- "Finalmente..."

### Template de Captura

```yaml
fonte: Amazon BR
produto: "[nome]"
produto_url: "[URL]"
categoria: "[categoria]"

review_estrelas: [1-5]
review_titulo: "[título]"
review_texto: "[texto relevante]"

tipo: [expectativa_frustrada|resultado_positivo|comparação]
insight: "[o que revela sobre o público]"
confidence: [alto|médio|baixo]
```

---

## Checklist Amazon BR

- [ ] 2-3 produtos/livros relacionados identificados
- [ ] Reviews de 1-3 estrelas priorizados
- [ ] Mínimo 10 reviews analisados
- [ ] Padrões de frustração identificados
- [ ] Linguagem de resultado capturada
