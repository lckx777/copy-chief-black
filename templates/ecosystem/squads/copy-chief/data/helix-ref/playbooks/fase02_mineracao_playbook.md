# Fase 2: Playbook de Mineração de Concorrentes

<quando_usar>
Ao preencher a Fase 2 do HELIX System (Pesquisa de Mercado e Concorrência).
Objetivo: Descobrir, extrair e analisar concorrentes ESCALADOS via Apify + detecção de cloaking.
</quando_usar>

## Mudança Crítica: Scoring de Escala Real

### Por que longevidade sozinha é insuficiente

Lógica antiga (incorreta): "Ad rodando 90 dias = validado"
Lógica real: Ad pode estar 90 dias no break-even, esquecido, ou vermelho

O indicador REAL de escala é volume simultâneo do mesmo asset:
- 15 variações do mesmo .mp4 rodando AGORA = criativo validado, multiplicando
- 30 ads apontando para mesma URL = LP convertendo, jogando tráfego

### Fórmula de Scale Score

```
Scale Score = (ads_mesma_url * 2) + (ads_mesmo_video * 1.75) + (dias_ativo * 0.1)
```

Componentes e pesos:
- ads_mesma_url (peso 2): LP validada, alto volume de tráfego
- ads_mesmo_video (peso 1.75): Criativo campeão sendo multiplicado
- dias_ativo (peso 0.1): Contexto temporal (secundário)

Exemplo de cálculo: Competidor com 12 ads para mesma URL, 8 ads com mesmo video, 45 dias ativo. Score = (12 * 2) + (8 * 1.75) + (45 * 0.1) = 24 + 14 + 4.5 = 42.5

## Visão Geral do Workflow

```
FASE 2 MINERACAO
  ETAPA 1: Descoberta (Apify Facebook Ads Library)
  ETAPA 2: Agrupamento e Scoring (mesma URL, mesmo video)
  ETAPA 3: Priorizacao (Top 10 por Scale Score)
  ETAPA 4: Deep Dive + Deteccao Cloaking
  ETAPA 5: Consolidacao (Preencher Template)
  CHECKPOINT: Arquivos intermediarios salvos
```

## ETAPA 1: Descoberta via Apify

### Actor Recomendado

```
curious_coder/facebook-ads-library-scraper
```
ou
```
apipi/facebook-ad-library-scraper (mais rapido)
```

### Input Padrao

```json
{
  "searchTerms": ["[KEYWORD PRINCIPAL]"],
  "countryCode": "BR",
  "adType": "ALL",
  "mediaType": "ALL",
  "activeStatus": "ACTIVE",
  "resultsLimit": 100
}
```

### Keywords por Nicho

Concursos: concurso publico, aprovacao, edital, concurseiro
Emagrecimento: emagrecer, perder peso, barriga, gordura
ED: disfuncao, potencia, vigor masculino
Financas: renda extra, investimento, dinheiro
Relacionamento: reconquistar, casamento, relacionamento

### Campos a Extrair do Dataset

- pageName: Agrupar por anunciante
- pageId: ID unico do anunciante
- adArchiveID: ID unico do ad
- startDate: Calcular dias ativo
- snapshot.link_url: CRITICO - Agrupar por URL destino
- snapshot.video_url: CRITICO - Agrupar por video asset
- snapshot.body_text: Copy do anuncio
- snapshot.title: Headline

## ETAPA 2: Agrupamento e Scoring

### Logica de Agrupamento

Para cada pageName (anunciante), calcular:

```python
# Pseudocodigo do scoring
for anunciante in anunciantes:
    ads = todos_ads_do_anunciante
    
    # Agrupar por URL destino
    urls = {}
    for ad in ads:
        url = normalize_url(ad.snapshot.link_url)
        urls[url] = urls.get(url, 0) + 1
    
    ads_mesma_url = max(urls.values()) if urls else 0
    
    # Agrupar por video
    videos = {}
    for ad in ads:
        if ad.snapshot.video_url:
            videos[ad.snapshot.video_url] = videos.get(video, 0) + 1
    
    ads_mesmo_video = max(videos.values()) if videos else 0
    
    # Dias ativo (do ad mais antigo)
    dias_ativo = (hoje - min(ad.startDate for ad in ads)).days
    
    # Score final
    scale_score = (ads_mesma_url * 2) + (ads_mesmo_video * 1.75) + (dias_ativo * 0.1)
```

### Normalizacao de URL

Remover antes de agrupar:
- Query params de tracking (fbclid, utm_*, ref)
- Trailing slashes
- Protocolo (http vs https)
- www vs non-www

```bash
# Exemplo de normalizacao
"https://www.oferta.com/vsl?fbclid=xxx&utm_source=fb"
-> "oferta.com/vsl"
```

### Arquivo de Checkpoint: Scoring

Salvar em: 01_scoring_competidores.yaml

```yaml
meta:
  phase: "02_mineracao_scoring"
  timestamp: "2026-01-06T14:30:00Z"
  total_anunciantes: 45
  total_ads_processados: 312

competidores_rankeados:
  - rank: 1
    page_name: "Metodo X"
    page_id: "123456789"
    scale_score: 42.5
    ads_same_url: 12
    ads_same_video: 8
    days_running: 45
    top_url: "https://metodox.com/vsl"
    top_video_hash: "abc123"
```

## ETAPA 3: Priorizacao (Top 10)

### Criterios de Corte

Score maior que 30: Altamente escalado - Deep dive prioritario
Score entre 15-30: Validando/escalando - Deep dive secundario
Score menor que 15: Testando - Ignorar ou monitorar

### Selecao Final

1. Ordenar por scale_score DESC
2. Selecionar Top 10 (ou Top 5 se nicho pequeno)
3. Verificar diversidade (nao pegar 10 do mesmo owner)

## ETAPA 4: Deep Dive + Deteccao de Cloaking

### Hierarquia de Fetch

```
TENTATIVA 1: web_fetch(url)
     | (se bloqueado/timeout/conteudo suspeito)
TENTATIVA 2: curl com UA mobile
     | (se ainda suspeito)
VERIFICACAO: Comparar com preview do ad
     | (se diferenca >30%)
FLAG: Cloaking detectado
```

### Deteccao de Cloaking

Sinais no Response:

Conteudo diferente do preview (peso ALTO): Texto/promessa completamente diferente
Scripts fingerprint (peso MEDIO): Canvas, WebGL, Battery API checks
Redirects multiplos (peso MEDIO): Meta-refresh, JS redirect, 30X chain
Pagina generica (peso ALTO): Blog, termos de uso, compliance
Erro/timeout seletivo (peso MEDIO): Funciona no browser, falha no fetch

Verificacao de Fingerprinting Scripts:

```bash
curl -sL "[URL]" | grep -iE "(fingerprint|canvas|webdriver|battery|navigator\.|cloaker|redirect)" | head -20
```

Threshold de Diferenca:

Se conteudo_fetchado vs copy_do_anuncio:
- Similaridade textual menor que 30% = CLOAKING CONFIRMADO
- Ausencia total de keywords do ad = CLOAKING CONFIRMADO
- Redirect para dominio diferente = CLOAKING PROVAVEL

### Quando Cloaking e Detectado

NAO abandonar o competidor. Documentar e usar dados do anuncio:

```yaml
competitor:
  name: "Metodo X"
  cloaking_detected: true
  cloaking_evidence:
    - content_mismatch: true
    - fingerprint_scripts: true
    - redirect_detected: "metodox.com -> safe.metodox.com"
  
  extracted_from_ad:
    headline: "[Texto do ad]"
    body_copy: "[Copy completo do ad]"
    cta: "[Texto do botao]"
    creative_type: "video"
    video_url: "[URL do video]"
  
  bypass_recommendation: "Anti-detect browser + residential proxy BR"
  priority: "MANUAL_REVIEW"
```

### Extracao por LP (Checklist Completo)

Para cada landing page acessivel:

```yaml
competitor:
  name: "[NOME]"
  page_id: "[ID]"
  url: "[URL]"
  
  scale_score: 42.5
  ads_same_url: 12
  ads_same_video: 8
  days_running: 45
  
  funnel_type: "[VSL|TSL|Quiz|Hibrido]"
  funnel_signals:
    has_video: true
    video_platform: "[Vimeo|Wistia|YouTube|Self-hosted]"
    cta_timing: "[Immediate|Delayed|Timer]"
    has_quiz: false
    has_progress_bar: false
  
  checkout_platform: "[Hotmart|Kiwify|Monetizze|Eduzz|Cakto|Proprio]"
  checkout_url_pattern: "[URL detectada]"
  price_detected: "R$ [valor]"
  guarantee_days: "[dias]"
  
  headline: "[H1 principal]"
  subheadline: "[Subhead]"
  promise_central: "[Promessa core]"
  timeframe: "[Prazo prometido]"
  
  target_bullets:
    - "[Bullet 1]"
    - "[Bullet 2]"
    - "[Bullet 3]"
  
  mup_apparent: "[Causa raiz que eles atacam]"
  mus_apparent: "[Solucao unica que propoem]"
  hero_ingredient: "[Se mencionado]"
  
  origin_story: true/false
  testimonials_count: "[N]"
  testimonials_type: "[Video|Print|Texto]"
  authority_signals:
    - "[Sinal 1]"
    - "[Sinal 2]"
  
  cloaking_detected: false
  
  weaknesses:
    - "[Fraqueza 1]"
    - "[Fraqueza 2]"
    - "[Fraqueza 3]"
```

### Identificacao de Tipo de Funil (Sinais HTML)

VSL (Video Sales Letter):
```html
<video ...>
<iframe src="*vimeo*|*wistia*|*youtube*">
<div class="*player*">
<button style="display:none" id="cta">
<script>setTimeout(showCTA, 300000)</script>
```

TSL (Text Sales Letter):
```html
<p>Texto longo...</p>
<h1>Headline impactante</h1>
<h2>Subhead</h2>
<button class="cta visible">
```

Quiz Funnel:
```html
<form>
<input type="radio">
<input type="checkbox">
<div class="progress">
<script>calculateScore()</script>
```

## ETAPA 5: Consolidacao

### Matriz Comparativa Final

Gerar matriz cruzando Top 10 com os seguintes criterios por competidor:
- Scale Score
- Funnel Type
- Checkout
- Preco
- MUP aparente
- MUS aparente
- Origin Story (Sim/Nao)
- Prova Social (Alta/Media/Baixa)
- Cloaking (Sim/Nao)
- Nossa Oferta (coluna para definir)

### Gaps e Oportunidades

Perguntas-guia:
1. O que NENHUM top 10 faz bem?
2. Que DOR REAL eles ignoram?
3. Que PROVA SOCIAL falta no mercado?
4. Que FORMATO esta sub-explorado?
5. Que MUP/MUS nao existe ainda?

### Angulos de Ataque

Para cada competidor top 5:

```
Contra [COMPETIDOR] (Score: X):
"Por que [problema do approach deles] quando voce pode [nosso diferencial]?"
```

## Arquitetura de Checkpoints

```
/home/claude/fase2_helix/
  01_scoring_competidores.yaml     <- Todos rankeados por Scale Score
  02_top10_selecionados.yaml       <- Top 10 com justificativa
  03_deep_dive/
    competidor_01.yaml             <- Ficha completa
    competidor_02.yaml
    ...
    competidor_10.yaml
  04_cloaking_flagged.yaml         <- Competidores com cloaking
  05_matriz_comparativa.md         <- Matriz final
  06_fase2_helix_preenchida.md     <- Template oficial preenchido
```

## Troubleshooting

### Apify retorna poucos resultados
- Testar keywords alternativas
- Remover filtro de pais
- Aumentar resultsLimit
- Tentar Actor alternativo

### Muitos competidores com cloaking
- Sinal de nicho grey/black hat
- Usar dados dos anuncios como fonte primaria
- Priorizar os SEM cloaking para deep dive
- Considerar bypass manual para top 3

### Scale Score muito baixo em todos
- Nicho pode estar em fase inicial
- Expandir keywords
- Verificar se esta buscando keywords corretas
- Pode ser oportunidade (pouca competicao validada)

### Video URL nao disponivel
- Meta Ads Library nem sempre expoe
- Usar hash do thumbnail como proxy
- Agrupar por URL + headline como fallback

## Quick Reference: Comandos

```bash
# Fetch de LP com UA mobile
curl -sL "[URL]" --max-time 15 \
  -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" \
  | head -500

# Verificar redirects
curl -sIL "[URL]" 2>&1 | grep -i "location"

# Buscar sinais de cloaking
curl -sL "[URL]" | grep -iE "(fingerprint|canvas|webdriver|battery)" | head -10

# Detectar checkout platform
curl -sL "[URL]" | grep -oE "(hotmart|kiwify|monetizze|eduzz|cakto)"

# Extrair pixels
curl -sL "[URL]" | grep -oE "fbq\('init',\s*'[0-9]+'\)" | head -5
```

## Integracao com Outras Fases

Fase 3 (Avatar) recebe: Linguagem VOC dos concorrentes
Fase 5 (MUP) recebe: Gaps de mecanismo nao explorados
Fase 6 (MUS) recebe: Diferenciacao clara vs mercado
Fase 9 (Leads) recebe: Angulos validados + anti-saturados

Principio: Fase 2 alimenta TODO o restante do briefing.
