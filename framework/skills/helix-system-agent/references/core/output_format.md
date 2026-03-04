# Formato de Output HELIX

Especificação de outputs intermediários otimizados para consumo por humanos E outros agentes Claude.

## Princípios de Output

### 1. Dual-Purpose Design

Todo output deve ser:
- Legível por humano: Estrutura clara, campos descritivos
- Parseável por agente: YAML válido, schema consistente, tipos explícitos

### 2. Checkpoints Obrigatórios

Cada fase produz checkpoint que serve de input para próxima fase.

```
Fase N -> checkpoint_faseN.yaml -> Fase N+1
```

### 3. Confidence Scoring

Todo output inclui nível de confiança:

- 0.9-1.0: Extraído diretamente de fonte primária
- 0.7-0.9: Inferido com alta certeza
- 0.5-0.7: Inferido com incerteza
- Menor que 0.5: Especulativo (requer validação)

## Schema de Checkpoint por Fase

### Fase 1: Identificação

```yaml
meta:
  phase: "01_identificacao"
  timestamp: "2026-01-06T14:30:00Z"
  status: complete
  confidence: 0.95

oferta:
  nome_produto: "string"
  nicho: "ED|EMAG|FINANCAS|RELACIONAMENTO|CONCURSOS|OUTRO"
  subnicho: "string"
  modelo_negocio: "Infoproduto|SaaS|Fisico|Hibrido"
  ticket: "R$ number"
  
cliente:
  nome: "string"
  empresa: "string|null"
  materiais_recebidos:
    - tipo: "briefing|pesquisa|vsl_referencia|reviews"
      arquivo: "path/to/file"
      processado: true

next_phase_inputs:
  nicho_definido: true
  materiais_organizados: true
  gaps_criticos: []
```

### Fase 2: Mineração (Checkpoint Principal)

```yaml
meta:
  phase: "02_mineracao"
  timestamp: "2026-01-06T14:30:00Z"
  status: complete
  confidence: 0.85
  total_ads_processados: 312
  total_competidores_encontrados: 45

competidores_top10:
  - rank: 1
    page_name: "string"
    page_id: "string"
    
    scale_score: 42.5
    ads_same_url: 12
    ads_same_video: 8
    days_running: 45
    
    top_url: "https://..."
    ad_library_link: "https://www.facebook.com/ads/library/?id=..."
    
    funnel_type: "VSL|TSL|Quiz|Hibrido"
    checkout_platform: "Hotmart|Kiwify|Monetizze|Eduzz|Cakto|Proprio"
    
    cloaking_detected: false
    cloaking_evidence: []
    
    headline: "string|null"
    promise_central: "string|null"
    mup_apparent: "string|null"
    mus_apparent: "string|null"
    
    weaknesses:
      - "string"
    
    data_confidence: 0.85

competidores_cloaked:
  - page_name: "string"
    page_id: "string"
    scale_score: 38.0
    cloaking_evidence:
      - "content_mismatch"
      - "fingerprint_scripts"
    extracted_from_ad:
      headline: "string"
      body_copy: "string"
    bypass_recommendation: "Anti-detect + residential proxy"

analise_mercado:
  saturacao_geral: "ALTA|MEDIA|BAIXA"
  formato_dominante: "VSL|TSL|Quiz"
  ticket_medio: "R$ number"
  mup_patterns:
    - pattern: "string"
      frequency: 3
  mus_patterns:
    - pattern: "string"
      frequency: 2
  gaps_identificados:
    - "string"
  oportunidades:
    - "string"

next_phase_inputs:
  top3_para_modelar:
    - "page_name_1"
    - "page_name_2"
    - "page_name_3"
  linguagem_voc_extraida: true
  angulos_validados:
    - "string"
  angulos_saturados:
    - "string"
```

### Fase 3: Avatar e Psicologia

```yaml
meta:
  phase: "03_avatar"
  timestamp: "2026-01-06T14:30:00Z"
  status: complete
  confidence: 0.80

avatar:
  nome_persona: "string"
  idade_range: "25-45"
  genero: "M|F|Ambos"
  
  situacao_atual:
    profissional: "string"
    financeira: "string"
    relacionamento: "string"
    saude: "string"
  
  dre: "string"
  dre_intensidade: 0.85
  
  medos_primarios:
    - medo: "string"
      intensidade: 0.9
    - medo: "string"
      intensidade: 0.7
      
  desejos_primarios:
    - desejo: "string"
      intensidade: 0.9
    - desejo: "string"
      intensidade: 0.8
  
  crencas_limitantes:
    - crenca: "string"
      origem: "string"
  
  one_belief_target: "string"
  
  vocabulario_real:
    - "frase exata de review/comentario"
  
  expressoes_comuns:
    - "expressao"

next_phase_inputs:
  dre_definida: true
  one_belief_definido: true
  linguagem_mapeada: true
```

### Fase 5: MUP (Mecanismo Único do Problema)

```yaml
meta:
  phase: "05_mup"
  timestamp: "2026-01-06T14:30:00Z"
  status: complete
  confidence: 0.90

mup:
  statement: "string (1-2 frases)"
  
  componentes:
    causa_raiz: "string"
    paradigm_shift: "string"
    vilao_externo: "string"
  
  validacao_rmbc:
    facilmente_digerivel: true
    genuinamente_unico: true
    intuitivamente_provavel: true
    
  origem: "CRIADO|MODELADO|REF:swipe_nome"
  
  conexao_dre: "Como o MUP amplifica a DRE"
  conexao_one_belief: "Como o MUP prepara a mudanca de crenca"

next_phase_inputs:
  mup_validado: true
  vilao_definido: true
  pronto_para_mus: true
```

### Fase 6: MUS (Mecanismo Único da Solução)

```yaml
meta:
  phase: "06_mus"
  timestamp: "2026-01-06T14:30:00Z"
  status: complete
  confidence: 0.90

mus:
  statement: "string (1-2 frases)"
  
  quatro_camadas:
    hero_ingredient:
      nome: "string"
      descricao: "string"
      proof_path: "string"
    
    gimmick_name:
      nome: "string"
      memorabilidade: 0.9
    
    origin_story:
      narrativa_curta: "string"
      credibilidade: 0.85
    
    authority_hook:
      autoridade: "string"
      tipo: "Pessoal|Cientifica|Social|Celebridade"
  
  validacao_rmbc:
    facilmente_digerivel: true
    genuinamente_unico: true
    intuitivamente_provavel: true
  
  espelhamento_mup:
    mup_statement: "string"
    mus_statement: "string"
    conexao_direta: true
    
  origem: "CRIADO|MODELADO|REF:swipe_nome"

next_phase_inputs:
  mus_validado: true
  espelhamento_confirmado: true
  pronto_para_big_offer: true
```

## Formato de Output Final (Fase Completa)

Quando uma fase é completada e entregue ao usuário:

```markdown
# Fase [N]: [Nome da Fase]

## Status
- Preenchimento: Completo
- Confianca: 85%
- Origem: [EXTRAIDO|MODELADO|CRIADO]

## Output Principal

[Conteudo do template preenchido 1:1]

## Checkpoint Salvo

Arquivo: checkpoint_fase[N].yaml
Pronto para: Fase [N+1]

## Gaps Identificados (se houver)

- [Gap 1 - requer input manual]
- [Gap 2 - requer validacao]

## Self-Critique

### O que esta forte:
- [Ponto forte 1]
- [Ponto forte 2]

### O que pode melhorar:
- [Ponto de melhoria 1]
- [Ponto de melhoria 2]

### Teste de Acionabilidade:
"Um copywriter junior conseguiria escrever uma VSL so com este briefing?"
Resposta: [SIM/PARCIALMENTE/NAO] - [Justificativa]
```

## Marcadores de Origem

- [REF: swipe_nome]: Padrão extraído de SWIPE validada
- [BASE: fundamento]: Conceito de material teórico
- [MODELADO: fonte]: Estrutura adaptada (não copiada)
- [CRIADO]: Elemento original HELIX
- [EXTRAIDO: fonte]: Dado extraído diretamente
- [PREENCHER: motivo]: Último recurso, requer input manual

## Validação de Output

Antes de entregar qualquer fase, verificar:

```yaml
checklist_entrega:
  estrutura_1_1: true
  especificidade: true
  modelagem_nao_copia: true
  dados_nao_inventados: true
  mup_mus_espelhados: true
  self_critique_feita: true
  checkpoint_salvo: true
  proximo_passo_claro: true
```
