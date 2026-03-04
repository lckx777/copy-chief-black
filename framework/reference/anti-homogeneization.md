---
phases: [RESEARCH, PRODUCTION]
priority: HIGH
tokens: ~1600
---

# Anti-Homogeneization Rules (v7.0)

> Fonte: Pesquisas Externas 05.md e 10.md + Fundamentos Universais v5
> Problema: 79% similaridade intra-modelo, outputs convergem para mesmo padrão
> Solução: Constraints divergentes obrigatórios
> **v7.0:** Especificidade = Cena de Filme (duas faces) + Alinhamento Fundamentos v5

---

## REGRA CARDINAL

**Copy que poderia ser usada por concorrente SEM alteração = REFAZER**

---

## 🚨 BLACK SPECIFICITY THRESHOLD (NOVO v6.3)

> **REGRA:** Especificidade Score < 8 = REFAZER imediatamente.
> Não existe "copy boa mas genérica". Genérica = falhou.

### Escala de Especificidade BLACK

| Score | Descrição | Decisão |
|-------|-----------|---------|
| 1-3 | Qualquer concorrente usaria sem alterar | ❌ **REFAZER** |
| 4-5 | Precisa adaptação moderada (20-40%) | ❌ **REFAZER** |
| 6-7 | Relativamente única, mas pode melhorar | ⚠️ **REVISAR** |
| **8-10** | Impossível confundir com concorrente | ✅ **APROVADO** |

### As Duas Faces da Especificidade (Fundamentos v5)

> Ref: copy-chief.md § Lente 2: Densidade Narrativa para checklist de validacao.
> O cérebro interpreta ESPECÍFICO como VERDADEIRO. Mas especificidade não é só números — é uma narrativa tão densa que parece cena de filme.

**Face 1: Dados Específicos** (a mais conhecida)
Números não-redondos, nomes, cidades, profissões, datas. O cérebro assume que detalhes tão precisos só viriam de experiência real.

**Face 2: Narrativa Específica** (a MAIS PODEROSA)
Cena tão vívida que o prospect se enxerga nela. Não precisa de números — precisa de DETALHES SENSORIAIS que transportam.

**Comparação:**
- Dados: "João, 47 anos, encanador de Sorocaba, perdeu 23kg em 87 dias."
- Narrativa: "Estava no vestiário quando ouvi duas mulheres falando. Uma tirou um vidro da bolsa e disse: 'toma, mas não conta pra ninguém. Minha sogra me deu e eu perdi 3 números de calça.'"

### Checklist de Especificidade (Face 1: Dados — 8 itens)

| # | Critério | Genérico (0 pts) | Específico (1 pt) |
|---|----------|------------------|-------------------|
| 1 | Nome | "pessoas", "clientes" | "Dona Maria, de Goiânia" |
| 2 | Idade | "adultos", "mulheres" | "47 anos" |
| 3 | Localização | "todo Brasil" | "bairro Setor Bueno, Goiânia" |
| 4 | Profissão | "empresário" | "dona de salão de beleza" |
| 5 | Número | "90%", "milhares" | "87.3%", "2.847 pessoas" |
| 6 | Data | "recentemente" | "14 de março de 2024" |
| 7 | Resultado | "melhorou" | "pressão foi de 180/120 para 124/81" |
| 8 | Sensorial | Ausente | "acordou às 3AM suando frio" |

### Checklist de Especificidade (Face 2: Narrativa — 5 dimensões)

| # | Dimensão | Fraco | Forte |
|---|----------|-------|-------|
| 1 | Dados Precisos | "Pessoas melhoraram" | "12.847 clientes, 87.3% sentiram alívio" |
| 2 | Cena Vívida | "Descobri um método" | "Estava no vestiário quando ouvi..." |
| 3 | Reação de Terceiros | Ausente | "O médico olhou os exames e disse..." |
| 4 | Contexto Inesperado | Genérico | "3h da manhã no banheiro" |
| 5 | Detalhes Sensoriais | "Me senti melhor" | "Acordei sem tonteira pela 1a vez em 7 anos" |

**Score = Face 1 (≥6/8) + Face 2 (≥3/5). AMBAS devem estar presentes.**

### Enforcement

```
SE Specificity Score < 8:
   REJEITAR com lista de itens faltantes

Exemplo:
"Especificidade: 5/8. Faltam: Nome (0), Número (0), Sensorial (0).
 Refazer adicionando estes 3 elementos."
```

---

## Testes Obrigatórios (Quality Gates)

### 1. Logo Test

> Ref: copy-chief.md § Logo Test (Lente 3) para checklist completo.

| Resultado | Ação |
|-----------|------|
| Funciona sem alteração | **REFAZER** |
| Precisa alterar 20%+ | REVISAR |
| Claramente identificável | APROVADO |

### 2. Competitor Swap Test

> "Um concorrente poderia roubar esta copy?"

Verificar:
- [ ] Mecanismo é PROPRIETÁRIO?
- [ ] Nome do produto/método aparece?
- [ ] Há elementos ÚNICOS da oferta?
- [ ] Prova social é ESPECÍFICA (nomes, números)?

---

## Clichês Proibidos por Nicho

### CONCURSOS

| Proibido | Por quê | Substituir por |
|----------|---------|----------------|
| "método infalível" | Todo mundo usa | [nome proprietário do método] |
| "passe em menos tempo" | Genérico | [prazo específico + contexto] |
| "decoreba não funciona" | Clichê | [problema específico com memorização] |
| "estudar de forma inteligente" | Vazio | [técnica específica nomeada] |
| "concurseiro aprovado" | Genérico | [cargo + órgão específico] |
| "método dos aprovados" | Usado demais | [nome único do sistema] |

### SAÚDE/EMAGRECIMENTO

| Proibido | Por quê | Substituir por |
|----------|---------|----------------|
| "emagreça sem dieta" | Saturado | [mecanismo específico nomeado] |
| "queimar gordura" | Genérico | [processo fisiológico específico] |
| "metabolismo acelerado" | Clichê | [nome do processo metabólico] |
| "segredo dos magros" | Overused | [descoberta específica + fonte] |
| "corpo dos sonhos" | Vazio | [resultado mensurável] |
| "transformação" | IA-speak | [mudança específica + prazo] |

### RELACIONAMENTO

| Proibido | Por quê | Substituir por |
|----------|---------|----------------|
| "recuperar casamento" | Genérico | [técnica nomeada + contexto] |
| "comunicação eficaz" | Clichê | [protocolo específico] |
| "conexão profunda" | Vazio | [comportamento específico] |
| "segredo das mulheres" | Saturado | [insight específico + fonte] |
| "atração irresistível" | Overused | [mecanismo psicológico nomeado] |

### RIQUEZA/RENDA EXTRA

| Proibido | Por quê | Substituir por |
|----------|---------|----------------|
| "renda extra" | Genérico demais | [valor específico + atividade] |
| "liberdade financeira" | Clichê | [cenário específico de liberdade] |
| "método comprovado" | Vazio | [evidência específica] |
| "trabalhar de casa" | Saturado | [rotina específica descrita] |
| "sem experiência" | Overused | [requisito real mínimo] |

---

## Palavras Banidas (Cross-Nicho)

### Adjetivos Vazios
- revolucionário, inovador, incrível, inacreditável
- único (sem especificação), exclusivo (sem prova)
- simples (sem demonstração), fácil (sem evidência)

### Substantivos Genéricos
- segredo, método, sistema (sem nome próprio)
- transformação, jornada, caminho
- solução, resposta, chave

### Verbos IA-Speak
- revolucionar, transformar, elevar, desbloquear
- empoderar, potencializar, alavancar

### Estruturas Banidas
- "In today's [adjetivo] world"
- "Introducing..."
- "What if I told you..."
- "The secret to..."
- "Finally, a solution..."
- "Imagine..."
- "X meets Y"

---

## Constraints de Divergência (Obrigatórios)

### Em Todo Prompt de Produção

```
RESTRIÇÕES ANTI-HOMOGENEIZAÇÃO:

1. NÃO use: [lista de clichês do nicho]
2. NÃO use estruturas: [lista de estruturas banidas]
3. OBRIGATÓRIO: nome proprietário para mecanismo
4. OBRIGATÓRIO: 3+ números específicos
5. OBRIGATÓRIO: 2+ exemplos únicos da oferta

TESTE FINAL: Concorrente consegue usar sem alterar?
Se SIM → REFAZER
```

### Checklist Pré-Entrega

- [ ] Logo Test: passaria se trocar logo?
- [ ] Competitor Swap Test: concorrente usaria?
- [ ] Tem nome proprietário para mecanismo?
- [ ] Tem números específicos (não round)?
- [ ] Tem exemplos únicos da oferta?
- [ ] Linguagem é da VOC (não genérica)?
- [ ] Zero palavras da lista de banidos?

---

## Metricas de Sucesso

| Métrica | Threshold | Ação se Falhar |
|---------|-----------|----------------|
| Genericidade Score | ≥ 8/10 | REFAZER |
| Logo Test | FAIL | REFAZER |
| Competitor Swap | FAIL | REVISAR |
| Clichês detectados | 0 | REVISAR cada um |
| Palavras banidas | 0 | SUBSTITUIR cada uma |

---

*v6.1 - Baseado em Pesquisas 05.md e 10.md (Artificial Hivemind)*
*Atualizado: 2026-01-30*
