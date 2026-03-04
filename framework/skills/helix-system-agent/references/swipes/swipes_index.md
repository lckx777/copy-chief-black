# Índice de SWIPEs - HELIX System

SWIPEs são VSLs validadas e escaladas. Use-os para modelar padrões comprovados, NUNCA para copiar conteúdo.

## Nomenclatura dos Arquivos

```
swipe_[nicho]_[oferta]_[numero]_[conteudo].md
```

| Componente | Descrição |
|------------|-----------|
| `nicho` | ed (disfunção erétil), emag (emagrecimento) |
| `oferta` | Nome da oferta/produto |
| `numero` | Ordem sequencial na VSL (01, 02, 03...) |
| `conteudo` | Descrição do que contém a seção |

---

## NICHO ED (Disfunção Erétil)

### sea_salt

VSL fragmentada em 5 partes:

| Arquivo | Seção | Fases que Alimenta |
|---------|-------|-------------------|
| `swipes/ed/sea_salt_01_leads.md` | Abertura e ganchos iniciais | Fase 9 |
| `swipes/ed/sea_salt_02_background_emotional.md` | História e conexão emocional | Fase 3, 10 |
| `swipes/ed/sea_salt_03_marketing_thesis.md` | Tese de marketing / mecanismo único | Fase 5, 6 |
| `swipes/ed/sea_salt_04_product_offer.md` | Apresentação do produto e oferta | Fase 6, 7 |
| `swipes/ed/sea_salt_05_close.md` | Fechamento e CTA | Fase 8 |

### masculinity_fruits

VSL completa (não fragmentada):

| Arquivo | Conteúdo |
|---------|----------|
| `swipes/ed/masculinity_fruits.md` | VSL completa de referência |

---

## NICHO EMAG (Emagrecimento)

### gut_drops

VSL fragmentada em 4 partes:

| Arquivo | Seção | Fases que Alimenta |
|---------|-------|-------------------|
| `swipes/emag/gut_drops_01_lead_historia.md` | Lead + história de abertura | Fase 9, 10 |
| `swipes/emag/gut_drops_02_problema_mecanismo.md` | Problema + mecanismo único | Fase 5, 6 |
| `swipes/emag/gut_drops_03_solucao_produto.md` | Solução + apresentação do produto | Fase 6, 7 |
| `swipes/emag/gut_drops_04_oferta_fechamento.md` | Oferta + fechamento | Fase 7, 8 |

### ozempure

VSL fragmentada em 7 partes:

| Arquivo | Seção | Fases que Alimenta |
|---------|-------|-------------------|
| `swipes/emag/ozempure_01_leads.md` | Variações de leads/ganchos | Fase 9 |
| `swipes/emag/ozempure_02_background_emotional.md` | Background emocional | Fase 3, 10 |
| `swipes/emag/ozempure_03_marketing_thesis.md` | Tese de marketing / mecanismo | Fase 5, 6 |
| `swipes/emag/ozempure_04_product_buildup.md` | Buildup e apresentação do produto | Fase 6, 7 |
| `swipes/emag/ozempure_05_oferta.md` | Estrutura da oferta | Fase 7 |
| `swipes/emag/ozempure_06_fechamento.md` | Fechamento e CTA | Fase 8 |
| `swipes/emag/ozempure_07_faq_extras.md` | FAQs e elementos extras | Fase 10 |

---

## Mapeamento SWIPE ↔ Fases

| Seção do SWIPE | Fases HELIX |
|----------------|-------------|
| `leads` / `lead_historia` | Fase 9 (Leads e Ganchos) |
| `background_emotional` | Fase 3 (Avatar), Fase 10 (Progressão Emocional) |
| `marketing_thesis` / `problema_mecanismo` | Fase 5 (MUP), Fase 6 (MUS) |
| `product_offer` / `solucao_produto` / `product_buildup` | Fase 6 (MUS), Fase 7 (Big Offer) |
| `oferta` / `oferta_fechamento` | Fase 7 (Big Offer), Fase 8 (Fechamento) |
| `close` / `fechamento` | Fase 8 (Fechamento) |
| `faq_extras` | Fase 10 (FAQs) |

---

## Como Usar SWIPEs

### Processo de Modelagem

1. **Identifique** o SWIPE mais próximo do nicho/subnicho do projeto atual
2. **Consulte** a seção específica que corresponde à fase que está preenchendo
3. **Extraia** PADRÕES e ESTRUTURAS, não conteúdo literal
4. **Adapte** para a oferta específica mantendo o que funciona
5. **Referencie** no briefing: `[REF: swipe_emag_ozempure_03]`

### O Que Extrair

| Extrair | Não Extrair |
|---------|-------------|
| Estrutura de argumentação | Copy literal |
| Sequência de emoções | Frases específicas |
| Padrão de provas | Dados/estudos citados |
| Formato de gancho | Headlines exatas |
| Fluxo de objeções | Nomes de ingredientes |

### Exemplo de Referência no Briefing

```markdown
**Gancho da Solução:**
"Descoberta de pesquisadores de [ORIGEM] revela [MECANISMO] que [BENEFÍCIO]"
[REF: swipe_emag_ozempure_03] - estrutura de gancho com origem + mecanismo + benefício
```

---

## Seleção de SWIPE por Projeto

### Se o projeto é nicho ED:
1. Consulte `sea_salt` primeiro (mais completo)
2. Use `masculinity_fruits` para variação

### Se o projeto é nicho EMAG:
1. Consulte `ozempure` primeiro (mais detalhado)
2. Use `gut_drops` para variação

### Se o projeto é outro nicho:
1. Identifique nicho mais próximo em dor/desejo
2. Adapte padrões com mais sofisticação
3. Sinalize claramente: `[MODELADO: swipe_X adaptado para nicho Y]`
