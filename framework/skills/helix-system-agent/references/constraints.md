# HELIX System - Constraints

> Regras invioláveis para produção de briefings de alta qualidade.
> Extraído de SKILL.md v6.0 para progressive disclosure.

---

## Constraints Operacionais

1. **Fidelidade 1:1 ao template** — Manter estrutura exata de cada fase
2. **Perguntar apenas dados factuais** — Impossíveis de inferir
3. **Validar MUP/MUS pelos 3 critérios RMBC** — Antes de entregar
4. **Usar marcadores em todo output:**
   - `[REF: swipe_nome]` — Padrão de SWIPE
   - `[BASE: fundamento]` — Conceito teórico
   - `[MODELADO: fonte]` — Estrutura modelada
   - `[CRIADO]` — Original HELIX
   - `[PREENCHER: motivo]` — Requer input manual
5. **Especificidade BLACK** — Dados devem ser ESPECÍFICOS e COERENTES (números não-redondos, nomes críveis)
6. **Self-critique obrigatória** — Antes de entregar cada fase

---

## Critérios RMBC

Todo MUP/MUS deve passar nestes 3 testes:

| Critério | Pergunta | Reprovado se... |
|----------|----------|-----------------|
| **Facilmente digerível?** | Explicável em 1-2 frases? | Precisa de 3+ frases |
| **Genuinamente único?** | Gera reação "wow"? | Já visto em concorrentes |
| **Intuitivamente provável?** | Faz sentido e tem base? | Parece forçado ou duvidoso |

---

## Princípios de Qualidade

1. **Especificidade** — Único para esta oferta específica
2. **Modelar sem copiar** — Elevar padrões, não reproduzir
3. **Coerência Narrativa** — Dados devem ser coerentes ENTRE SI (não precisam ser "verificáveis")
4. **Espelhamento MUP↔MUS** — Conexão direta problema-solução
5. **Arquitetura de persuasão** — Copy, não features

---

## Anti-Superficialidade

Checklist antes de entregar qualquer fase:

| # | Critério | Pergunta |
|---|----------|----------|
| 1 | **Especificidade Radical** | Tem números, prazos, exemplos? |
| 2 | **Conexão Emocional** | Toca DOR ou DESEJO real? |
| 3 | **Prova Integrada** | Cada afirmação tem caminho de prova? |
| 4 | **Diferenciação Real** | Serviria pro concorrente? Se sim, refazer. |
| 5 | **Acionabilidade** | Copywriter júnior consegue escrever a partir disso? |

---

## Hierarquia de Fontes

| Prioridade | Fonte | Quando Usar |
|------------|-------|-------------|
| 1 | Informação direta do usuário | Sempre que disponível |
| 2 | Reviews e linguagem real | Copy-paste exato |
| 3 | SWIPEs do mesmo nicho | Escalados |
| 4 | SWIPEs de nichos semelhantes | Quando falta no nicho |
| 5 | Fundamentos teóricos | Para estrutura |
| 6 | Criação original | Último recurso |

---

## Checkpoints de Validação (BLOQUEANTES)

⚠️ **NÃO PROSSEGUIR SEM VALIDAÇÃO**

### Checkpoint Pós-Fase 5 (MUP)
1. Invocar `copy-critic` no MUP desenvolvido
2. Aguardar verdict: STAND / REVISE / ESCALATE
3. Salvar: `briefings/{offer}/validations/mup-validation.md`

### Checkpoint Pós-Fase 6 (MUS)
1. Invocar `copy-critic` no MUS desenvolvido
2. Aguardar verdict: STAND / REVISE / ESCALATE
3. Salvar: `briefings/{offer}/validations/mus-validation.md`

### Gate de Briefing (Pré-Produção)

| Requisito | Obrigatório |
|-----------|-------------|
| MUP verdict = STAND | ✅ |
| MUS verdict = STAND | ✅ |
| helix-complete.md gerado | ✅ |
| 10 fases completas | ✅ |

---

*Extraído de SKILL.md v6.0 - HELIX System Agent*
