---
phases: [BRIEFING]
priority: HIGH
tokens: ~1200
---

# Mecanismo Unico - Framework Ramalho (v1.0)

> **Principio:** O Mecanismo Unico e onde mora a conversao e escala.
> **Fonte:** Copy Chief BLACK + Framework Ramalho (Puzzle Pieces)
> **Criado:** 2026-02-02 (BSSF Score 8.6, GBS 90%)

---

## REGRA CARDINAL

> **NENHUMA oferta avanca para production/ sem Mecanismo Unico VALIDATED.**
> Hook mecanismo-validation.sh bloqueia automaticamente.

---

## Estrutura do Mecanismo Unico (3 Partes)

### PARTE 1: MUP (Mecanismo Unico do Problema)

| Componente | Descricao | Obrigatorio |
|------------|-----------|-------------|
| **Nova Causa** | O que REALMENTE causa o problema (nao o que o mercado fala) | SIM |
| **Sexy Cause** | NOME intrigante para a nova causa | SIM |
| **Problema Fundamental** | Como a nova causa se aplica TANGIVELMENTE | SIM |
| **Causa Raiz** | Historia por tras do problema | NAO |

**Criterios de Validacao:**
- Diferente do que o mercado ja fala?
- Tira a culpa do avatar?
- Explica por que outras solucoes falharam?

**Teste da Sexy Cause:** A pessoa vai querer CONTAR para alguem?

### PARTE 2: MUS (Mecanismo Unico da Solucao)

| Componente | Descricao | Obrigatorio |
|------------|-----------|-------------|
| **Nova Oportunidade** | INVERSO da nova causa | SIM |
| **Ingrediente Hero** | Componente PRINCIPAL que resolve | SIM |
| **Gimmick Name** | Nome chiclete do INGREDIENTE (nao do sistema!) | SIM |
| **Origin Story** | Historia de COMO foi descoberto | SIM |
| **Authority Hook** | Validacao via super estrutura | SIM |

**DISTINCAO CRITICA:**
- **Gimmick Name** = ligado ao INGREDIENTE (ex: "Pink Salt Trick")
- **Authority Hook** = ligado a SUPER ESTRUTURA (ex: "Monjaro Natural")

**Teste do Gimmick Name:** Gruda E esta ligado ao ingrediente hero?

### PARTE 3: INDUTOR (Metodo/Produto)

| Componente | Descricao | Obrigatorio |
|------------|-----------|-------------|
| **Nome Sistema** | Nome proprietario do metodo | SIM |
| **Componentes** | Partes do metodo (siglas) | NAO |
| **Ativacao** | Como o cliente usa | NAO |

---

## Formula do Gancho da Solucao (Ramalho)

```
"Ja ouviu falar desse [GIMMICK NAME] que [ORIGIN STORY] estao usando
secretamente para [DESEJO]? Ja estao chamando isso de [AUTHORITY HOOK]."
```

**Exemplo:**
> "Ja ouviu falar desse Pink Salt Trick que as atrizes de Hollywood estao usando
> secretamente para secar gordura na barriga em poucos dias?
> Ja estao chamando isso de Monjaro Natural."

---

## Arquivo Canonico: mecanismo-unico.yaml

Cada oferta DEVE ter na raiz:
```
{oferta}/mecanismo-unico.yaml
```

**Schema:** `~/.claude/schemas/mecanismo-unico.schema.yaml`
**Template:** `~/.claude/templates/mecanismo-unico-template.md`

### Estados Validos

| Estado | Significado | Permite Production? |
|--------|-------------|---------------------|
| UNDEFINED | Nao iniciado | NAO |
| DRAFT | Em construcao | NAO |
| PENDING_VALIDATION | Completo, aguardando MCP | NAO |
| VALIDATED | Validado via MCP | SIM |
| APPROVED | Humano aprovou | SIM |

---

## Sequencia de Validacao (Fase 5-6 HELIX)

```
1. Preencher mecanismo-unico.yaml
      |
2. consensus (MCP zen) - TOP 3 candidatos MUP
      |
3. blind_critic (MCP copywriting) - MUP Statement (score >= 8)
      |
4. Definir MUS baseado no MUP
      |
5. blind_critic (MCP copywriting) - MUS Statement (score >= 8)
      |
6. emotional_stress_test (MCP copywriting) - MUP+MUS (genericidade >= 8)
      |
7. Atualizar state: VALIDATED
      |
8. HUMANO aprova -> state: APPROVED
```

### Criterios RMBC (Media >= 7)

| Criterio | Pergunta | Threshold |
|----------|----------|-----------|
| Digerivel | Explicavel em 1-2 frases? | >= 7 |
| Unico | Gera "nunca ouvi isso antes"? | >= 7 |
| Provavel | Faz sentido intuitivo? | >= 7 |
| Conectado | Liga com emocao do avatar? | >= 7 |

---

## Enforcement Automatico

### Hook: mecanismo-validation.sh

- **Evento:** PreToolUse (Write/Edit)
- **Target:** Arquivos em `*/production/*`
- **Comportamento:**
  - Verifica se mecanismo-unico.yaml existe
  - Verifica se state e VALIDATED ou APPROVED
  - BLOQUEIA se nao atende criterios

### Script de Validacao

```bash
# Validar uma oferta
~/copywriting-ecosystem/scripts/validate-mecanismo.sh path/to/offer

# Validar todas as ofertas
~/copywriting-ecosystem/scripts/validate-mecanismo.sh --all
```

**Exit codes:**
- 0 = VALIDATED ou APPROVED
- 1 = DRAFT ou UNDEFINED
- 2 = PENDING_VALIDATION
- 3 = File not found

---

## Adaptacao por Nicho

### O que e "Ingrediente Hero"?

| Nicho | Ingrediente Hero = | Exemplo |
|-------|-------------------|---------|
| Suplemento | Substancia principal | Pink Salt |
| Educacao/Concursos | Tecnica core | Tecnica Ovelha Negra |
| Relacionamento | Protocolo principal | Tecnica do Espelho |
| Riqueza | Estrategia principal | Metodo dos 3 Potes |

### Biblioteca de Sexy Causes

| Nicho | Problema | Sexy Cause |
|-------|----------|------------|
| Emagrecimento | Come demais | "Hungry Brain Syndrome" |
| Concursos | Estuda errado | "Ilusao de Aprendizado" |
| Concursos | Nao memoriza | "Ponto Cego de Leitura" |
| ED | Bloqueio | "Sindrome de Dessensibilizacao" |

---

## Ofertas Migradas

| Oferta | State | MUP | MUS |
|--------|-------|-----|-----|
| Hacker do Concurso | APPROVED | Ovelha Negra | Tecnica Ovelha Negra |
| Gabaritando Lei Seca | APPROVED | Buraco da Lei Seca | Metodo Gabaritando |
| GPT dos Aprovados | APPROVED | Desalinhamento de Contexto | Sistema de 3 Etapas |
| Gabaritando Portugues | DRAFT | Ponto Cego de Leitura | (pendente) |

---

## Checklist Nova Oferta

- [ ] Criar `mecanismo-unico.yaml` a partir do schema
- [ ] Preencher MUP (nova causa, sexy cause, problema fundamental)
- [ ] Validar MUP via consensus + blind_critic (>= 8)
- [ ] Preencher MUS (ingrediente hero, gimmick name, origin story, authority hook)
- [ ] Validar MUS via blind_critic (>= 8)
- [ ] Validar MUP+MUS via emotional_stress_test (>= 8)
- [ ] Preencher RMBC scores
- [ ] Atualizar state para VALIDATED
- [ ] HUMANO aprova -> APPROVED
- [ ] Rodar `validate-mecanismo.sh` para confirmar

---

*v1.0 - BSSF Score 8.6, GBS 90%*
*Baseado em Framework Ramalho (Puzzle Pieces)*
*Criado: 2026-02-02*
