# Índice de SWIPEs - Landing Page Agent

SWIPEs são landing pages validadas e escaladas. Use-os para modelar padrões comprovados.

## Nomenclatura dos Arquivos

```
swipe_lp_[oferta].md
```

| Componente | Descrição |
|------------|-----------|
| `lp` | Landing page (diferencia de VSL) |
| `oferta` | Nome da oferta/produto |

---

## NICHO CONCURSOS

### gabaritando_portugues

LP completa de produto digital para português em concursos.

| Arquivo | Conteúdo | Blocos Referência |
|---------|----------|-------------------|
| `swipes/concurso/swipe_lp_gabaritando_portugues.md` | LP completa com análise | Todos (1-14) |

**Destaques:**
- DRE forte: "sentir-se burro"
- Ruminação com VOC real de concurseiros
- Stack de valor 7.5x
- 4 passos (variação do padrão 3)
- Fechamento binário expandido

---

## Mapeamento SWIPE ↔ Blocos

| Seção do SWIPE | Blocos LP |
|----------------|-----------|
| Headline | Bloco 1 |
| Depoimentos | Bloco 2 |
| Ruminação | Bloco 3 |
| Passo a Passo | Bloco 4 |
| Benefícios | Bloco Extra |
| Entregáveis | Bloco 5 |
| Bônus | Bloco 6 |
| Para Quem Serve | Bloco 7 |
| Recapitulando | Bloco 8 |
| CTA + Preço | Bloco 9 |
| Como Acessar | Bloco Extra |
| Conversa Séria | Bloco 10 |
| Autoridade | Bloco 11 |
| FAQ | Bloco 13 |

---

## Como Usar SWIPEs

### Processo de Modelagem

1. **Identifique** o SWIPE mais próximo do nicho do projeto
2. **Consulte** o bloco específico que está gerando
3. **Extraia** PADRÕES e ESTRUTURAS, não copy literal
4. **Adapte** para a oferta específica
5. **Referencie** no output: `[REF: swipe_lp_gabaritando_portugues]`

### O Que Extrair

| Extrair | Não Extrair |
|---------|-------------|
| Estrutura de blocos | Copy literal |
| Padrão de ruminações | Frases específicas |
| Formato de bullets | Dados específicos |
| Fluxo emocional | Nomes de entregáveis |
| Ratio de ancoragem | Preços exatos |

### Exemplo de Referência no Output

```markdown
## BLOCO 3: RUMINAÇÃO

{Copy gerada}

---
Fonte: Fases 3-5 (Avatar + DRE + MUP)
[REF: swipe_lp_gabaritando_portugues] - estrutura de 4 ruminações em aspas
```

---

## Seleção de SWIPE por Projeto

### Se o projeto é nicho Concursos:
1. Consulte `gabaritando_portugues` (único disponível)
2. Adapte VOC para a matéria específica

### Se o projeto é outro nicho:
1. Use estrutura geral de `gabaritando_portugues`
2. Substitua VOC pelo do nicho específico
3. Sinalize: `[MODELADO: swipe_lp_gabaritando adaptado para nicho X]`
