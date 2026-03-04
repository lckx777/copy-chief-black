# Micro-Unidades Interpretativas (v1.0)

> Fonte: AIOS Framework — Extracao de padroes LINGUISTICOS (nao so quotes) do avatar
> Principio: VOC extrai O QUE o avatar diz. Micro-Unidades extraem COMO ele diz.
> Ref: aios-principles.md, voc-research.md
> Criado: 2026-02-27

---

## REGRA CARDINAL

> **Copy que usa palavras do avatar mas nao soa como o avatar = falhou.**
> Quotes sao materia-prima. Micro-Unidades sao o MOLDE da voz.
> Sem molde, a copy e ventriloquismo — palavras certas, tom errado.

---

## 6 Dimensoes Linguisticas do Avatar

| # | Dimensao | O que Extrair | Exemplo |
|---|----------|---------------|---------|
| 1 | **Padroes de Argumentacao** | Como conecta causa→efeito | "Porque..." / "O problema e que..." / "Ai que..." |
| 2 | **Vocabulario Preferencial** | Palavras que ESCOLHE (nao tecnicas) | "Acabou comigo" vs "Me prejudicou" |
| 3 | **Estruturas Frasais** | Como constroi frases tipicas | Curtas, fragmentadas, "tipo..." |
| 4 | **Ritmo Cognitivo** | Pausas, aceleracoes, digressoes | "Sei la... mas tipo assim..." |
| 5 | **Metaforas Nativas** | Como traduz abstrato em concreto | "Parece uma panela de pressao" |
| 6 | **Nivel de Sofisticacao** | Complexidade linguistica natural | Coloquial / Tecnico / Misto |

---

## Detalhamento por Dimensao

### 1. Padroes de Argumentacao

**O que observar:**
- Como o avatar explica CAUSA de problemas ("e porque...", "o problema e que...", "o que acontece e...")
- Como justifica decisoes ("ai eu pensei...", "fui la e...", "nao tinha outra opcao")
- Como contra-argumenta ("sim, mas...", "ta, so que...", "eu sei, mas...")

**Extracao:** Listar os 5-10 conectores mais usados e a logica que seguem.

**Impacto na Copy:** Copy que usa "porque" quando avatar diz "ai que" soa artificial.

### 2. Vocabulario Preferencial

**O que observar:**
- Palavras ESCOLHIDAS (nao tecnicas) para descrever problema
- Intensificadores naturais ("demais", "pra caramba", "muito", "absurdo")
- Diminutivos/aumentativos habituais ("probleminha", "dorzinha", "barrigao")

**Extracao:** Mapa de sinonimos — palavra tecnica → palavra que o avatar USA.

**Impacto na Copy:** "Disturbio gastrointestinal" vs "barriga presa" — mesma coisa, som completamente diferente.

### 3. Estruturas Frasais

**O que observar:**
- Comprimento medio de frase (curta/media/longa)
- Fragmentos vs frases completas
- Uso de parenteticos e apartes ("sabe como e ne", "enfim")
- Pontuacao implicita (onde faria pausas, onde acelera)

**Extracao:** 3-5 estruturas frasais tipicas com exemplos.

**Impacto na Copy:** Avatar que fala em fragmentos + copy em frases longas e formais = desconexao.

### 4. Ritmo Cognitivo

**O que observar:**
- Onde faz PAUSAS (hesitacao, reflexao, emocao)
- Onde ACELERA (entusiasmo, raiva, medo)
- Digressoes naturais ("ah, e outra coisa...", "voltando...")
- Repeticoes por enfase ("nada, NADA funciona")

**Extracao:** Mapa de ritmo — momentos de pausa vs aceleracao.

**Impacto na Copy:** Copy sem ritmo = texto corrido. Copy com ritmo do avatar = conversa natural.

### 5. Metaforas Nativas

**O que observar:**
- Como transforma abstrato em concreto ("e como se fosse...", "parece...")
- Analogias do cotidiano ("panela de pressao", "bomba-relogio", "formiga carregando elefante")
- Comparacoes com experiencias conhecidas

**Extracao:** Listar metaforas encontradas na VOC. Categorizar por tema.

**Impacto na Copy:** Metafora inventada pela IA vs metafora que o avatar JA USA. A segunda conecta, a primeira soa forçada.

### 6. Nivel de Sofisticacao

**O que observar:**
- Vocabulario simples vs elaborado
- Uso de girias, regionalismos
- Capacidade de articulacao (expressa bem vs "nao sei explicar")
- Mistura coloquial + tecnico (aprendeu termos do problema)

**Extracao:** Classificar em escala: Coloquial / Coloquial-Tecnico / Misto / Tecnico.

**Impacto na Copy:** Copy muito sofisticada para avatar coloquial = credibilidade zero.

---

## Voice Sample

**Definicao:** 2-3 frases que capturam a VOZ do avatar perfeitamente.

**Como construir:**
1. Ler 50+ quotes do avatar
2. Identificar padroes das 6 dimensoes
3. Compor 2-3 frases FICTÍCIAS que SOAM como o avatar
4. Validar: "Se misturar com quotes reais, e impossivel distinguir?"

**Uso:** Voice Sample e o calibrador de tom para toda producao. Blade lê antes de escrever cada capitulo/bloco.

---

## Integracao com Pipeline

| Fase | Acao com Micro-Unidades |
|------|------------------------|
| Research | Extrair 6 dimensoes durante coleta VOC |
| Briefing | Voice Sample informa tom do briefing (Fase 3 HELIX) |
| Production | Blade carrega `linguistic-patterns.md` no pre-flight |
| Review | Hawk verifica: "Copy soa como avatar?" via dimensoes |

---

## Anti-Patterns

| Anti-Pattern | Correto |
|--------------|---------|
| Usar quotes do avatar mas em tom formal | Aplicar Estrutura Frasal + Ritmo Cognitivo do avatar |
| Inventar metaforas "melhores" | Usar metaforas que o avatar JA usa (Dimensao 5) |
| Copy sofisticada para avatar coloquial | Calibrar Nivel de Sofisticacao (Dimensao 6) |
| Fragmentos onde avatar fala corrido | Respeitar Estrutura Frasal real (Dimensao 3) |
| Ignorar ritmo (texto corrido sem pausas) | Mapear Ritmo Cognitivo com pausas e aceleracoes |

---

*v1.0 — AIOS Micro-Unidades Interpretativas para Copy Chief BLACK*
*6 dimensoes linguisticas para extracao VOC avancada*
*Ref: voc-research.md, anti-homogeneization.md*
*Criado: 2026-02-27*
