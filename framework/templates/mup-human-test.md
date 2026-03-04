---
template_name: "mup-human-test"
template_version: "1.0.0"
template_type: "methodology"
description: "Protocolo de teste humano para validacao de MUP com criterios RMBC"
phase: "briefing"
output_format: "markdown"
---

# Template: Teste Humano de MUP

> **Objetivo:** Validar MUP com avatares REAIS antes de produzir VSL
> **Quando usar:** APÓS validação por IA, ANTES de produzir VSL
> **Investimento evitado:** R$5K-50K em VSL que não converte
> **Criado:** 2026-02-02 | v6.9

---

## Por que Testar com Humanos?

| Problema | Consequência |
|----------|--------------|
| IA valida IA | Viés confirmado |
| MUP parece bom no papel | Não ressoa com avatar real |
| Produz VSL caro | Descobre que não funciona após gastar |

**Regra:** 30 minutos de teste humano > 30 horas de retrabalho.

---

## Processo de Teste

### Passo 1: Recrutar Avatares (3-5 pessoas)

**Onde encontrar:**
- Grupo de WhatsApp do nicho
- Comunidade no Facebook
- Lista de leads existente
- Conhecidos que se encaixam no avatar

**Critérios de seleção:**
- [ ] Está no público-alvo (idade, situação, problema)
- [ ] NÃO conhece sua oferta ainda
- [ ] Disposto a dar feedback honesto

### Passo 2: Preparar o Teste

**O que mostrar:** APENAS o MUP (sem copy, sem oferta)

**Script de apresentação:**
```
"Descobri uma informação interessante e queria sua opinião sincera.

[LER O MUP]

O que você acha? Isso faz sentido pra você?"
```

**NÃO fazer:**
- Explicar contexto demais
- Defender se questionarem
- Dar mais informações

### Passo 3: Coletar Reações

**Observar:**

| Reação | O que significa |
|--------|-----------------|
| Olhos arregalados | Interesse genuíno ✅ |
| "Conta mais!" | Curiosidade ativada ✅ |
| "Interessante..." (vago) | Educado mas não convencido ⚠️ |
| "Não sei, será?" | Cético ⚠️ |
| Muda de assunto | Não ressoou ❌ |

**Perguntas de follow-up:**
1. "O que você achou mais interessante?"
2. "Alguma coisa não fez sentido?"
3. "Você contaria isso pra alguém?"
4. "Isso muda como você pensa sobre [problema]?"

### Passo 4: Documentar Resultados

```markdown
## Teste Humano de MUP: [Nome da Oferta]

### MUP Testado
[Descrição completa do MUP]

### Avatares Testados

| # | Perfil | Reação Inicial | Perguntas que Fez | Score |
|---|--------|----------------|-------------------|-------|
| 1 | [idade, situação] | [reação] | [perguntas] | 1-5 |
| 2 | ... | ... | ... | ... |
| 3 | ... | ... | ... | ... |

### Análise

**Pontos fortes identificados:**
- [o que ressoou]

**Objeções levantadas:**
- [o que questionaram]

**Ajustes necessários:**
- [o que precisa mudar]

### Veredicto

| Score Médio | Decisão |
|-------------|---------|
| 4-5 | ✅ APROVADO - Prosseguir para VSL |
| 2-3 | ⚠️ REVISAR - Ajustar MUP |
| 1 | ❌ TROCAR - MUP não funciona |
```

---

## Critérios de Aprovação

| Reações | Resultado |
|---------|-----------|
| 4-5 de 5 interessados | ✅ **APROVADO** |
| 2-3 de 5 interessados | ⚠️ **REVISAR MUP** |
| 0-1 de 5 interessados | ❌ **TROCAR MUP** |

---

## Gate no Workflow

```
MUP validado por IA (consensus)
         ↓
[TESTE HUMANO] ← ESTE TEMPLATE
         ↓
Teste passou?
    │
    ├── SIM → Produzir VSL
    │
    └── NÃO → Voltar para Fase 5 (gerar mais MUPs)
```

---

## Output Esperado

Salvar em: `briefings/{oferta}/validations/mup-human-test-{date}.md`

```yaml
---
type: mup-human-test
offer: [nome]
date: YYYY-MM-DD
avatars_tested: 5
approval_rate: X%
verdict: APPROVED | REVISE | REJECT
---
```

---

## Integração com production-agent

**REGRA:** SE `mup-human-test.md` NÃO EXISTE:
→ production-agent AVISA antes de produzir VSL

```
⚠️ WARNING: MUP não foi testado com humanos.
Recomendação: Executar teste humano antes de investir em VSL.
Continuar mesmo assim? (risco de retrabalho)
```

---

*Template v6.9 - Tool Enforcement System*
