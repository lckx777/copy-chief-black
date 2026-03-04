# /clickup-setup — ClickUp Integration Setup

Set up ClickUp integration for an offer in the copywriting ecosystem.

## Usage

```
/clickup-setup [offer-path]
```

## Examples

```
/clickup-setup concursos/decifra-lei-seca
/clickup-setup saude/neuvelys
/clickup-setup relacionamento/quimica-amarracao
```

## Instructions

When this command is invoked:

1. **Validate offer exists:**
   ```bash
   ls ~/copywriting-ecosystem/{offer-path}/helix-state.yaml
   ```
   If not found, show error and list available offers.

2. **Check if already configured:**
   - Look for `{offer}/clickup-sync.yaml`
   - If exists, show current config and ask to reconfigure

3. **Get ClickUp hierarchy:**
   Use ClickUp MCP tools:
   ```
   clickup_get_workspace_hierarchy → Find or create niche folder
   ```

4. **Create ClickUp structure:**
   Run the sync engine to generate setup instructions:
   ```bash
   bun run ~/.claude/scripts/clickup-sync-engine.ts setup {offer-path}
   ```

5. **Execute each MCP tool call:**
   For each instruction from the sync engine:
   - Create folder (if niche folder doesn't exist)
   - Create list for the offer
   - Create parent task
   - Create 10 HELIX phase subtasks
   - Create 3 gate tasks (Research, Briefing, Production)
   - Create 4 deliverable tasks (VSL, LP, Creatives, Emails)
   - Create 5 research tasks (VOC, Competitors, Mechanism, Avatar, Synthesis)

6. **Save mapping file:**
   Create `{offer}/clickup-sync.yaml` with all task IDs:
   ```yaml
   workspace_id: "90133067831"
   space_id: "901313380205"
   folder_id: "{created-folder-id}"
   list_id: "{created-list-id}"
   parent_task_id: "{created-parent-task-id}"
   phase_tasks:
     fase_01: "{task-id}"
     # ... fase_02 through fase_10
   gate_tasks:
     research: "{task-id}"
     briefing: "{task-id}"
     production: "{task-id}"
   deliverable_tasks:
     vsl: "{task-id}"
     landing_page: "{task-id}"
     creatives: "{task-id}"
     emails: "{task-id}"
   research_tasks:
     voc: "{task-id}"
     competitors: "{task-id}"
     mechanism: "{task-id}"
     avatar: "{task-id}"
     synthesis: "{task-id}"
   last_synced: "{current-timestamp}"
   ```

7. **Initial sync:**
   Read helix-state.yaml and sync current state to ClickUp:
   - Update completed phases
   - Update passed gates
   - Set current phase status

8. **Confirm setup:**
   Show summary with:
   - Number of tasks created
   - Current sync state
   - Link to ClickUp list

## ClickUp Workspace

- **Workspace ID:** 90133067831
- **Space:** Team Space (901313380205)

## Notes

- ClickUp MCP tools are only available when Claude Code has internet access
- Rate limits may apply — batch operations are throttled automatically
- After setup, gate syncs happen automatically via clickup-gate-sync.ts hook
- Time tracking starts automatically via clickup-time-tracking.ts hook
- Deliverable syncs happen automatically via clickup-deliverable-sync.ts hook
