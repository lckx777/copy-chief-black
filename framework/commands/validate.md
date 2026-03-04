# /validate — Run Quality Gate for Current Phase

Read the active offer's helix-state.yaml to determine current phase, then:

1. Load the appropriate task file from `~/.claude/tasks/`:
   - RESEARCH phase → `~/.claude/tasks/research-quality-gate.md`
   - BRIEFING phase → `~/.claude/tasks/briefing-quality-gate.md`
   - PRODUCTION phase → `~/.claude/tasks/production-quality-gate.md`
   - DELIVERED phase → `~/.claude/tasks/delivery-quality-gate.md`

2. Read the task file completely.

3. Create a TaskCreate checklist with ALL steps from the task file.

4. Execute each step sequentially:
   - For file verification steps: use Glob/Read to check existence
   - For MCP steps: use the appropriate MCP tool (validate_gate, blind_critic, etc)
   - For human approval: use AskUserQuestion

5. After all steps, present a summary:
   - PASSED items (with scores where applicable)
   - FAILED items (with specific feedback)
   - RECOMMENDATION: advance phase or fix issues

If no offer is detected, show error and suggest `/status` or `ecosystem-guide`.

Arguments:
- $ARGUMENTS can specify offer path: `/validate concursos/decifra-lei-seca`
- If no argument, detect from current-offer.json or most recent offer
