# HELIX System — Briefing em 10 Fases

> O HELIX System transforma pesquisa bruta em um briefing estrategico completo para producao de copy.

## O que e

O HELIX e um sistema de briefing em 10 fases que combina:
- **Research findings** (VOC, avatar, mercado)
- **Competitor analysis** (ads, funnels, positioning)
- **Mecanismo Unico** (MUP + MUS)
- **Emotional architecture** (DRE escalation)

## As 10 Fases

### Fase 1: Avatar Deep Dive
Perfil completo do avatar: demografico, psicografico, comportamental. Linguagem real (verbatim VOC).

### Fase 2: Problema / Dor
Mapeamento de dores em 5 niveis de escalada emocional:
1. Fisico/funcional
2. Emocional
3. Social
4. Relacional
5. Identidade

### Fase 3: DRE (Dominant Residual Emotion)
Identificacao da emocao dominante residual: Medo, Vergonha, Frustracao, Raiva, Culpa.

### Fase 4: Mecanismo Unico (MUP)
O Mecanismo Unico do Problema — a causa raiz que ninguem mais explica.

### Fase 5: Mecanismo Unico (MUS)
O Mecanismo Unico da Solucao — como o produto resolve a causa raiz.

### Fase 6: Promessa / Transformacao
A promessa central e a transformacao before/after.

### Fase 7: Prova / Autoridade
Stack de provas: estudos, expert, testimonials, numeros.

### Fase 8: Competitor Landscape
Posicionamento vs concorrentes. O que eles dizem e o que falta.

### Fase 9: Objection Map
Top 10 objecoes e respostas pra cada uma.

### Fase 10: One Belief
A unica crenca que o prospect precisa ter para comprar.

## Usando o HELIX

### Via slash command

```
/helix-parallel saude/meu-produto
```

Roda as 10 fases em paralelo (4 subagentes).

### Via pedido direto

```
Crie o briefing HELIX para saude/meu-produto
```

Helix roteia para Atlas (@briefer).

### Estado do HELIX

Cada oferta tem um `helix-state.yaml`:

```yaml
phases:
  1-avatar: DONE
  2-problema: DONE
  3-dre: DONE
  4-mup: DONE
  5-mus: IN_PROGRESS
  6-promessa: NOT_STARTED
  7-prova: NOT_STARTED
  8-competitors: NOT_STARTED
  9-objections: NOT_STARTED
  10-one-belief: NOT_STARTED
completion: 4/10
```

## Output

As 10 fases geram arquivos em:

```
{oferta}/briefings/phases/
  01-avatar-deep-dive.md
  02-problema-dor.md
  03-dre-mapping.md
  04-mecanismo-problema.md
  05-mecanismo-solucao.md
  06-promessa-transformacao.md
  07-prova-autoridade.md
  08-competitor-landscape.md
  09-objection-map.md
  10-one-belief.md
```

## Pre-requisitos

O HELIX requer que a fase de Research esteja completa:
- VOC extraido (minimo 50 verbatims)
- Avatar definido
- Concorrentes mapeados
- MUP rascunhado

Use `validate_gate` para verificar se a Research esta pronta.
