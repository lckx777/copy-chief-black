# Research Workflow

> Quando e como usar subagents para pesquisa.
> **v2.0:** general-purpose obrigatorio (custom types NAO herdam MCPs)

## WARNING: Subagent Type

> **SEMPRE usar `subagent_type="general-purpose"` para tasks de research.**
> O tipo `researcher` NÃO tem acesso a MCPs (Apify, Firecrawl, Playwright) no runtime.
> Custom subagent types recebem apenas Read, Write, WebSearch — sem ToolSearch para carregar deferred tools.

## Quando Usar

- Extração de VOC (Voice of Customer)
- Análise de concorrentes
- Pesquisa de mecanismo
- Profiling de avatar
- Qualquer coleta de dados externos

## Como Invocar

```
Task(
  subagent_type="general-purpose",
  prompt="[descrição da pesquisa]
         Oferta: [nome]
         Tipo: [voc|competitors|mechanism|avatar]
         Output: [caminho do arquivo]

         IMPORTANTE: Use ToolSearch para carregar Apify tools antes de extrair.
         Prioridade: Apify > Playwright > Firecrawl > WebSearch (ultimo resort)."
)
```

## Workflow Padrão

```
1. IDENTIFICAR tipo de research necessário
2. INVOCAR general-purpose com prompt específico + instrução de usar ToolSearch
3. AGUARDAR retorno (caminho + summary)
4. LER summary.md para verificar qualidade
5. SE gaps → invocar novamente com foco específico
6. PROSSEGUIR para próxima fase
```

## Exemplo: VOC Research

```
Task(
  subagent_type="general-purpose",
  prompt="Extrair VOC do YouTube para nicho concursos.
         Oferta: hacker
         Buscar: 'como passar em concurso público'
         Mínimo: 50 quotes
         Output: concursos/hacker/research/voc/raw/youtube-extraction.md

         INSTRUÇÃO TÉCNICA:
         1. Use ToolSearch para carregar Apify tools (query: 'apify youtube')
         2. Use call-actor com actor YouTube scraper para extrair comentários REAIS
         3. NÃO use WebSearch como primeira opção — é ÚLTIMO RESORT
         4. Processe em batches de 15, salve em arquivo"
)
```

## Outputs Esperados

```
{oferta}/research/{type}/
├── raw/           ← Dados brutos (NUNCA carregar)
├── processed/     ← Dados categorizados
└── summary.md     ← 500 tokens (SEMPRE ler primeiro)
```

## Qualidade Mínima

- 50+ quotes por plataforma
- Confidence ≥70%
- Gaps explicitamente identificados
- Métricas de engagement incluídas

## Próximo Passo

Após research completo → Invocar `general-purpose` com prompt de synthesizer para consolidar, ou prosseguir para HELIX.

---

*v2.0 - Fix: researcher → general-purpose (custom types sem MCPs)*
*BSSF Score 9.2, GBS 95%*
*Atualizado: 2026-02-20*
