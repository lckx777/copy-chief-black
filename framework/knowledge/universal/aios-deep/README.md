# AIOS Deep Reference

> Documentacao detalhada dos 4 dominios AIOS Core.
> Leitura on-demand, nao carregado automaticamente.
> Curado de: github.com/SynkraAI/aios-core (2026-03-03)

## Indice

| Arquivo | Conteudo | Linhas |
|---------|----------|--------|
| `synapse-engine.md` | 8 layers, brackets, manifest, formatting, session mgmt | ~400 |
| `agent-system.md` | 12 personas, activation pipeline, handoff, memory | ~500 |
| `quality-gates.md` | 3-layer pipeline, weighted scoring, anti-homog, auto-advance | ~600 |
| `hook-architecture.md` | 50+ hooks, dispatch queue, circuit breaker, safety | ~700 |

## Quando Ler

- Implementando novo layer Synapse → `synapse-engine.md`
- Criando novo agente ou modificando activation → `agent-system.md`
- Ajustando thresholds ou adicionando gate → `quality-gates.md`
- Criando novo hook ou debugging pipeline → `hook-architecture.md`
