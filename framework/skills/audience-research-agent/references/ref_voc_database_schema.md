# Voice of Customer Library - Formato de Banco de Dados

> **Usar para:** Estruturar VOC coletado de forma consultável e reutilizável
> **Benefício:** Outros agentes (HELIX, Lead, Close) podem fazer queries específicas

---

## Estrutura do Banco de Dados VOC

A VOC Library é estruturada como banco de dados em YAML, organizado por categorias consultáveis.

### Schema Principal

```yaml
voc_library:
  metadata:
    produto: "[nome]"
    nicho: "[nicho]"
    data_coleta: "[YYYY-MM-DD]"
    total_quotes: [número]
    fontes_utilizadas: [lista]
    
  # ═══════════════════════════════════════════════════════════
  # ÍNDICE POR TIPO DE INSIGHT
  # ═══════════════════════════════════════════════════════════
  
  dores:
    superficiais: []    # Sintomas visíveis, reclamações comuns
    intermediarias: []  # Causas percebidas, frustrações
    viscerais: []       # Raiz emocional, vergonha, medo profundo
    
  desejos:
    declarados: []      # O que dizem querer abertamente
    implicitos: []      # O que realmente buscam
    secretos: []        # O que têm vergonha de admitir
    
  objecoes:
    preco: []           # "É caro", "não tenho dinheiro"
    tempo: []           # "Não tenho tempo", "demora muito"
    esforco: []         # "Parece difícil", "não vou conseguir"
    ceticismo: []       # "Já tentei", "não funciona"
    adequacao: []       # "Não é pra mim", "meu caso é diferente"
    
  linguagem:
    metaforas: []       # Analogias recorrentes
    expressoes: []      # Frases-chave repetidas
    emocional: []       # Palavras de carga emocional alta
    tecnica: []         # Termos específicos do nicho
    
  gatilhos:
    sistema1: []        # Ativam decisão emocional
    sistema2: []        # Justificativas racionais
    reptilianos: []     # Poder, segurança, controle, etc.
```

---

## Formato de Cada Quote

Cada entrada no banco segue este schema:

```yaml
- id: "VOC-[TIPO]-[NÚMERO]"
  quote: "[texto verbatim exato]"
  fonte:
    plataforma: "[YouTube|Instagram|TikTok|ML|RA|Reddit|Amazon]"
    url: "[link se disponível]"
    data: "[YYYY-MM-DD]"
    contexto: "[descrição breve da situação]"
  classificacao:
    tipo_primario: "[dor|desejo|objeção|linguagem|gatilho]"
    subtipo: "[superficial|visceral|declarado|secreto|etc]"
    emocao: "[frustração|esperança|raiva|medo|vergonha|etc]"
    intensidade: [1-5]  # 1=leve, 5=extrema
  validacao:
    confidence: "[alto|médio|baixo]"
    aparece_em_outras_fontes: [true|false]
    fontes_confirmacao: ["[lista se aplicável]"]
  uso_sugerido:
    headline: [true|false]
    lead: [true|false]
    bullet: [true|false]
    testimonial_style: [true|false]
    objecao_handle: [true|false]
```

---

## Exemplo Completo - Nicho Emagrecimento

```yaml
voc_library:
  metadata:
    produto: "Método XYZ Emagrecimento"
    nicho: "emagrecimento feminino 35+"
    data_coleta: "2024-12-27"
    total_quotes: 47
    fontes_utilizadas: 
      - Reclame Aqui
      - YouTube
      - Instagram
      - Mercado Livre
    
  dores:
    superficiais:
      - id: "VOC-DOR-001"
        quote: "Já tentei de tudo e nada funciona pra mim"
        fonte:
          plataforma: YouTube
          url: "https://youtube.com/..."
          data: "2024-12-15"
          contexto: "Comentário em vídeo de nutricionista"
        classificacao:
          tipo_primario: dor
          subtipo: superficial
          emocao: frustração
          intensidade: 3
        validacao:
          confidence: alto
          aparece_em_outras_fontes: true
          fontes_confirmacao: ["Instagram", "Reclame Aqui"]
        uso_sugerido:
          headline: true
          lead: true
          bullet: false
          testimonial_style: false
          objecao_handle: false
          
    viscerais:
      - id: "VOC-DOR-015"
        quote: "Tenho vergonha de tirar foto com meus filhos. Sempre me escondo atrás de todo mundo"
        fonte:
          plataforma: Instagram
          url: "https://instagram.com/p/..."
          data: "2024-12-10"
          contexto: "Comentário em post de antes/depois"
        classificacao:
          tipo_primario: dor
          subtipo: visceral
          emocao: vergonha
          intensidade: 5
        validacao:
          confidence: alto
          aparece_em_outras_fontes: true
          fontes_confirmacao: ["YouTube", "TikTok"]
        uso_sugerido:
          headline: true
          lead: true
          bullet: true
          testimonial_style: true
          objecao_handle: false
          
  desejos:
    secretos:
      - id: "VOC-DES-008"
        quote: "Queria poder usar biquíni sem ficar me cobrindo o tempo todo"
        fonte:
          plataforma: TikTok
          url: "https://tiktok.com/..."
          data: "2024-12-20"
          contexto: "Storytime sobre insegurança corporal"
        classificacao:
          tipo_primario: desejo
          subtipo: secreto
          emocao: esperança
          intensidade: 4
        validacao:
          confidence: alto
          aparece_em_outras_fontes: true
          fontes_confirmacao: ["Instagram"]
        uso_sugerido:
          headline: true
          lead: true
          bullet: true
          testimonial_style: true
          objecao_handle: false
          
  objecoes:
    ceticismo:
      - id: "VOC-OBJ-003"
        quote: "Já gastei mais de 5 mil reais em curso, suplemento, nutricionista... e continuo na mesma"
        fonte:
          plataforma: Reclame Aqui
          url: "https://reclameaqui.com.br/..."
          data: "2024-12-18"
          contexto: "Reclamação sobre produto concorrente"
        classificacao:
          tipo_primario: objeção
          subtipo: ceticismo
          emocao: raiva
          intensidade: 5
        validacao:
          confidence: alto
          aparece_em_outras_fontes: true
          fontes_confirmacao: ["YouTube", "Mercado Livre"]
        uso_sugerido:
          headline: false
          lead: true
          bullet: false
          testimonial_style: false
          objecao_handle: true
          
  linguagem:
    metaforas:
      - id: "VOC-LING-001"
        quote: "efeito sanfona"
        fonte:
          plataforma: YouTube
          contexto: "Termo recorrente em múltiplos comentários"
        classificacao:
          tipo_primario: linguagem
          subtipo: metafora
          emocao: frustração
          intensidade: 3
        validacao:
          confidence: alto
          aparece_em_outras_fontes: true
          fontes_confirmacao: ["Instagram", "TikTok", "Reclame Aqui"]
        uso_sugerido:
          headline: true
          lead: true
          bullet: true
          testimonial_style: false
          objecao_handle: false
          
    emocional:
      - id: "VOC-LING-010"
        quote: "desesperada"
        fonte:
          plataforma: múltiplas
          contexto: "Palavra recorrente em desabafos"
        classificacao:
          tipo_primario: linguagem
          subtipo: emocional
          emocao: desespero
          intensidade: 5
        validacao:
          confidence: alto
          aparece_em_outras_fontes: true
        uso_sugerido:
          headline: true
          lead: true
          bullet: false
          testimonial_style: true
          objecao_handle: false

  gatilhos:
    sistema1:
      - id: "VOC-GAT-001"
        quote: "Imagina acordar e a roupa que você ama finalmente servir"
        fonte:
          plataforma: Instagram
          contexto: "Frase de alta ressonância em comentários"
        classificacao:
          tipo_primario: gatilho
          subtipo: sistema1
          emocao: esperança
          intensidade: 4
        validacao:
          confidence: médio
        uso_sugerido:
          headline: true
          lead: true
          bullet: true
          testimonial_style: false
          objecao_handle: false
          
    reptilianos:
      - id: "VOC-GAT-005"
        quote: "Quero que meu marido me olhe do jeito que olhava antes"
        fonte:
          plataforma: YouTube
          contexto: "Comentário emocional em vídeo de transformação"
        classificacao:
          tipo_primario: gatilho
          subtipo: reptiliano
          gatilho_especifico: "aceitação social"
          emocao: medo
          intensidade: 5
        validacao:
          confidence: alto
          aparece_em_outras_fontes: true
        uso_sugerido:
          headline: true
          lead: true
          bullet: true
          testimonial_style: true
          objecao_handle: false
```

---

## Queries Rápidas para Outros Agentes

### Para Headlines
```
Filtrar: uso_sugerido.headline = true AND intensidade >= 4
```

### Para Leads
```
Filtrar: tipo_primario = "dor" AND subtipo = "visceral"
```

### Para Bullets de Benefício
```
Filtrar: tipo_primario = "desejo" AND uso_sugerido.bullet = true
```

### Para Handle de Objeções
```
Filtrar: tipo_primario = "objeção" AND uso_sugerido.objecao_handle = true
```

### Para Testimonial-Style Copy
```
Filtrar: uso_sugerido.testimonial_style = true AND confidence = "alto"
```

### Por Intensidade Emocional
```
Filtrar: intensidade >= 4 (para copy mais agressivo)
Filtrar: intensidade <= 2 (para copy mais suave)
```

---

## Resumo Estatístico (Incluir no Output)

Ao final da VOC Library, incluir:

```yaml
estatisticas:
  total_quotes: [número]
  por_tipo:
    dores: [número]
    desejos: [número]
    objecoes: [número]
    linguagem: [número]
    gatilhos: [número]
  por_intensidade:
    nivel_5: [número]
    nivel_4: [número]
    nivel_3: [número]
    nivel_2: [número]
    nivel_1: [número]
  por_confidence:
    alto: [número]
    medio: [número]
    baixo: [número]
  por_fonte:
    reclame_aqui: [número]
    youtube: [número]
    instagram: [número]
    tiktok: [número]
    mercado_livre: [número]
    reddit: [número]
    amazon: [número]
  validacao_cruzada:
    quotes_multi_fonte: [número]
    quotes_fonte_unica: [número]
```
