# Copywriting MCP Plugin

Plugin MCP especializado para Direct Response Copywriting, integrado com o HELIX System e **BLACK Framework v6.4**.

## Stack

- **Runtime:** Bun (TypeScript)
- **Database:** SQLite (bun:sqlite nativo)
- **Protocol:** MCP (Model Context Protocol)
- **Framework:** BLACK v6.4 (Fear-First, Visceral > Lógico)
- **Custo:** 100% local, zero APIs pagas

## Instalação

```bash
# Já instalado em ~/.claude/plugins/copywriting-mcp/

# Inicializar banco de dados
cd ~/.claude/plugins/copywriting-mcp
bun run src/db/init.ts

# Verificar configuração MCP em ~/.claude/mcp.json
```

## Tools Disponíveis

| Tool | Descrição |
|------|-----------|
| `voc_search` | Busca VOC por emoção, keyword, intensidade |
| `get_phase_context` | Carrega contexto para fase HELIX |
| `validate_gate` | Valida gates (research, briefing, production) + BLACK Gate |
| `blind_critic` | Avaliação cega de copy + Vergonha/Culpa amplifiers |
| `emotional_stress_test` | 5 testes: Genericidade, Fear Hierarchy, Visceral, Scroll-Stop, Prova Social |
| `write_chapter` | Escrita por capítulos + Templates BLACK (mecanismo, fear-first) |
| `layered_review` | Revisão em 3 camadas |
| `black_validation` | **NOVO v2.0:** Validação completa dos 6 gates BLACK |

## Resources

| Resource | Descrição |
|----------|-----------|
| `copywriting://templates/puzzle-pieces` | Template 20+ elementos |
| `copywriting://templates/vsl-chapters` | Estrutura 6 capítulos VSL |
| `copywriting://prompts/blind-critic` | Prompt avaliação cega |
| `copywriting://prompts/emotional-stress` | Prompt 4 testes |
| `copywriting://prompts/anti-hivemind` | Constraints anti-AI |

## Uso

```
# Buscar VOC por emoção
voc_search emotion="frustração" nicho="concursos" min_intensity=4

# Carregar contexto da fase 5
get_phase_context phase=5 offer_path="concursos/hacker"

# Validar research gate
validate_gate gate_type="research" offer_path="concursos/hacker"

# Avaliação cega de copy
blind_critic copy="[texto]" copy_type="hook" offer_id="concursos/hacker"

# Stress test emocional
emotional_stress_test copy="[texto]" copy_type="vsl" nicho="concursos"

# Escrever capítulo
write_chapter chapter=1 offer_path="concursos/hacker"

# Revisão em camadas
layered_review copy="[texto]" layer=1 copy_type="vsl"
```

## Metodologia

Baseado em:
- **Pesquisas Profundas 00-10.md** - Princípios de IA + Copy
- **H&W Publishing (R$ 2B/ano)** - Metodologia Puzzle Pieces
- **Vestige** - Memory decay (FSRS-6)
- **Superpowers** - Workflows mandatórios
- **claude-mem** - Context injection pattern

## Estrutura

```
copywriting-mcp/
├── src/
│   ├── server.ts           # MCP entry point
│   ├── db/
│   │   ├── sqlite.ts       # Database module
│   │   └── init.ts         # Initialization script
│   └── tools/              # 7 tools
├── hooks/                  # 3 hooks
├── prompts/                # Templates e prompts
├── data/                   # SQLite database
└── workspace/              # Session state
```

## Database Tables

- `voc_quotes` - VOC com embeddings
- `swipes` - Swipe library
- `competitors` - Competitor intel
- `validations` - Histórico de validações
- `helix_progress` - Progress HELIX
- `session_state` - Recovery após /compact

## Versão

v2.0.0 - BLACK Framework Integration

### Changelog v2.0.0

- **NEW:** `black_validation` tool - Validação completa 6 gates BLACK
- **NEW:** Fear Hierarchy 5 níveis no `emotional_stress_test`
- **NEW:** BLACK GATE no `validate_gate` (production gate)
- **NEW:** Templates BLACK (mecanismo, fear-first) no `write_chapter`
- **NEW:** Vergonha/Culpa amplifiers no `blind_critic`
- **UPD:** Prompts com Fear-First methodology
- **UPD:** README com documentação BLACK Framework v6.4

---

*Criado para o ecossistema de copywriting de Luca Pimenta*
