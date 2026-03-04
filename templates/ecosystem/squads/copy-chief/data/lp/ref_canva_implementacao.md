# Implementação Canva - Mapeamento Template LP

Referência para implementação automatizada de LP no template Canva.

---

## Template Base

| Campo | Valor |
|-------|-------|
| Design ID | `DAG-OSDyB5Q` |
| Título | Template de Página |
| Total de Páginas | 23 |
| Edit URL | https://www.canva.com/design/DAG-OSDyB5Q/edit |

---

## Mapeamento Página → Bloco → Campos

| Página | Bloco | Nome | Campos para Substituir |
|--------|-------|------|------------------------|
| 1 | 1 | Headline (simples) | `{promessa principal}`, `{tempo especfico}`, `{objeo/dificuldade}` |
| 2 | 1 | Headline (antes/depois) | `{promessa principal}`, `{tempo especfico}`, `{objeo/dificuldade}`, `{situao inicial negativa}`, `{nome do produto}`, `{resultado positivo desejado}` |
| 3-6 | 2 | Depoimentos | `RESUMO DE DESTAQUE DA PROVA SOCIAL` (4 cards) |
| 7 | 3 | Ruminação | `{ao repetitiva/dor cotidiana}`, `{resultado frustrante}`, `{dor especfica}`, `RUMINAO 1-4`, `{resultado/benefcio principal}`, `{objeo maior}`, `{nome do produto}` |
| 8 | 4 | Passo a Passo | `{resultado principal}`, `{INSIRA O PASSO 1-3}`, `{ADICIONE UMA BREVE DESCRIO}` |
| 9 | Extra | Benefícios | `Benefcio 1-4` |
| 10-11 | 5 | Entregáveis | `{NOME DO SEU PRODUTO}`, `{Promessa Principal}`, `{resultado desejado}`, `{tempo especfico}` |
| 12-13 | 6 | Bônus | `{Transformao}`, `{benefcio principal}`, `{promessa principal}` |
| 14 | 7 | Para Quem Serve | `{NOME DO SEU PRODUTO}`, 6 bullets de qualificação, `{DESEJO DA PERSONA}` |
| 15 | 8 | Recapitulando | `{NOME DO PRODUTO}`, entregáveis + valores, `{SOMATRIA}` |
| 16 | 9 | CTA + Preço | `8x de R$ 8,40`, `R$67` |
| 17 | Extra | Como Acessar | `{NOME DO PRODUTO}`, `{REFORAR A PROMESSA}` |
| 18 | 10 | Conversa Séria | `{dor da persona}`, `{NOME DO PRODUTO}`, `{TRANSFORMAO}` |
| 19 | 11 | Autoridade | `SEU NOME`, `{NOME DO SEU PRODUTO}`, `BREVE DESCRICO` |
| 20 | 12 | CTA Repetido | Mesmo conteúdo da página 16 |
| 21 | 13 | FAQ | Perguntas e respostas |
| 22-23 | 14 | Rodapé | `{Nome do Autor/Empresa}`, `{Nome da Marca/Negcio}`, `{Ano}` |

---

## Fluxo de Implementação

### Fase 1: Preparação

```
1. Copiar template base (DAG-OSDyB5Q)
2. Renomear cópia para: "LP - {Nome do Produto}"
3. Obter design_id da cópia
```

### Fase 2: Substituição de Texto

Processar páginas na ordem:

```
Grupo 1 (Páginas 1-2): Headline
Grupo 2 (Páginas 3-6): Depoimentos  
Grupo 3 (Página 7): Ruminação
Grupo 4 (Página 8): Passo a Passo
Grupo 5 (Página 9): Benefícios
Grupo 6 (Páginas 10-13): Entregáveis + Bônus
Grupo 7 (Páginas 14-15): Para Quem + Recapitulando
Grupo 8 (Páginas 16-20): CTAs + Conversa + Autoridade
Grupo 9 (Páginas 21-23): FAQ + Rodapé
```

### Fase 3: Validação

```
1. Verificar consistência de {nome do produto} em todas as páginas
2. Verificar preço consistente nas páginas 15, 16, 20
3. Confirmar todas as substituições foram feitas
```

---

## Placeholders por Fonte HELIX

| Placeholder Template | Fonte HELIX | Exemplo |
|---------------------|-------------|---------|
| `{nome do produto}` | Fase 1 | "GPT dos Aprovados" |
| `{promessa principal}` | Fase 7 | "estudar 2x mais rápido" |
| `{tempo especfico}` | Fase 7 | "7 dias" |
| `{objeo/dificuldade}` | Fase 3 | "não saber usar tecnologia" |
| `{dor especfica}` | Fase 3 + DRE | "sentir-se burro em português" |
| `RUMINAO 1-4` | Fase 2 (VOC) | Pensamentos internos em aspas |
| `{resultado principal}` | Fase 7 | "acertar qualquer questão" |
| `{INSIRA O PASSO 1-3}` | Fase 6 (MUS) | "Entenda", "Aplique", "Colha" |
| `Benefcio 1-4` | Fase 7 | Resultados do método |
| `{NOME DO SEU PRODUTO}` | Fase 1 | Nome completo |
| `{TRANSFORMAO}` | Fase 7 | "ser aprovado no concurso" |
| `SEU NOME` | Fase 1 | Nome do expert |
| `BREVE DESCRICO` | Fase 1 | Bio resumida |

---

## Páginas Opcionais

| Página | Bloco | Quando Usar | Quando Remover |
|--------|-------|-------------|----------------|
| 2 | Headline (antes/depois) | Tem provas visuais | Não tem antes/depois |
| 3-6 | Depoimentos | Tem 4 depoimentos | Ajustar para quantidade real |

---

## Checklist de Implementação

### Antes de Começar

- [ ] Copy aprovada dos 14 blocos
- [ ] Todos os placeholders mapeados
- [ ] Preço definido (parcelamento + à vista)
- [ ] Nome do expert e bio
- [ ] Logo disponível (se tiver)

### Durante Implementação

- [ ] Página 1-2: Headline preenchida
- [ ] Páginas 3-6: Depoimentos inseridos
- [ ] Página 7: Ruminação com 4 pensamentos
- [ ] Página 8: 3 passos do mecanismo
- [ ] Página 9: 4 benefícios
- [ ] Páginas 10-11: Entregáveis descritos
- [ ] Páginas 12-13: Bônus descritos
- [ ] Página 14: 6 bullets de qualificação
- [ ] Página 15: Stack de valor com preços
- [ ] Páginas 16 e 20: CTAs com preço correto
- [ ] Página 17: Como acessar
- [ ] Página 18: Conversa séria
- [ ] Página 19: Autoridade
- [ ] Página 21: FAQ
- [ ] Páginas 22-23: Rodapé legal

### Após Implementação

- [ ] Revisar consistência de nome do produto
- [ ] Revisar consistência de preço
- [ ] Verificar se não ficou placeholder visível
- [ ] Exportar link de visualização

---

## Comandos do Conector Canva

### Criar Cópia do Template

```
Usar: Canva:generate-design ou duplicar manualmente
Parâmetro: design_type = baseado no template
```

### Editar Texto

```
Usar: Canva:start-editing-transaction
Seguido de: substituições de texto página por página
Finalizar: Canva:commit-editing-transaction
```

### Verificar Resultado

```
Usar: Canva:get-design-content
Verificar: Nenhum placeholder {entre chaves} visível
```

### Entregar Link

```
Usar: Canva:get-design
Retornar: edit_url para o usuário
```

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Placeholder não substituído | Verificar encoding (alguns têm caracteres especiais) |
| Texto não cabe | Reduzir copy ou ajustar fonte no Canva |
| Páginas duplicadas | Remover variação não usada (ex: página 2 se não usar antes/depois) |
| Depoimentos insuficientes | Remover páginas 5-6 se tiver menos de 4 |
