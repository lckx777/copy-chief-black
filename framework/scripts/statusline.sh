#!/usr/bin/env bash
# ~/.claude/scripts/statusline.sh
# Claude Code statusLine — Copy Chief BLACK
# v8.0 - PERSISTENT SOURCES ONLY (BSSF S4: zero volatile dependency)
#
# Sources (priority order):
#   1. helix-state.yaml  (persistent, per offer — field: phase or workflow_phase)
#   2. project_state.yaml (persistent, per offer — field: current_phase or phase)
#   3. cwd walk-up detection (filesystem)
#
# Format: [PERSONA] offer | PHASE | ctx% | cwd (branch)
# Fallback (no offer detected): cwd (branch) | ctx% | model

input=$(cat)

# Extract fields from JSON input
cwd=$(echo "$input" | jq -r '.cwd // .workspace.current_dir // empty')
model=$(echo "$input" | jq -r '.model.display_name // empty')
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
vim_mode=$(echo "$input" | jq -r '.vim.mode // empty')
session_name=$(echo "$input" | jq -r '.session_name // empty')

ECOSYSTEM_ROOT="$HOME/copywriting-ecosystem"

persona=""
offer_name=""
phase_label=""

# ─── Phase -> Persona mapping ───────────────────────────────────────────
map_phase_to_persona() {
  case "$(echo "$1" | tr '[:lower:]' '[:upper:]')" in
    RESEARCH)   echo "VOX" ;;
    BRIEFING)   echo "ATLAS" ;;
    PRODUCTION) echo "BLADE" ;;
    REVIEW)     echo "HAWK" ;;
    DELIVERED)  echo "HELIX" ;;
    SETUP)      echo "HELIX" ;;
    IDLE)       echo "HELIX" ;;
    *)          echo "HELIX" ;;
  esac
}

# ─── Detect offer from cwd (walk up to find helix-state.yaml) ───────────
detect_from_cwd() {
  local check_dir="${1:-$cwd}"
  [ -z "$check_dir" ] && return

  while [ "$check_dir" != "/" ] && [ "$check_dir" != "$HOME" ]; do
    if [ -f "$check_dir/helix-state.yaml" ]; then
      # Extract phase: try 'phase' first, then 'workflow_phase'
      local detected_phase
      detected_phase=$(grep -E '^\s*phase\s*:' "$check_dir/helix-state.yaml" 2>/dev/null | head -1 | sed 's/#.*//' | sed 's/.*:\s*//' | tr -d "\"' " | xargs | tr '[:lower:]' '[:upper:]')
      if [ -z "$detected_phase" ] || [ "$detected_phase" = "NULL" ]; then
        detected_phase=$(grep -E '^\s*workflow_phase\s*:' "$check_dir/helix-state.yaml" 2>/dev/null | head -1 | sed 's/#.*//' | sed 's/.*:\s*//' | tr -d "\"' " | xargs | tr '[:lower:]' '[:upper:]')
      fi

      if [ -n "$detected_phase" ] && [ "$detected_phase" != "NULL" ]; then
        phase_label="$detected_phase"
      fi

      # Extract offer name: use offer_path if available, else directory name
      local offer_path
      offer_path=$(grep -E '^\s*offer_path\s*:' "$check_dir/helix-state.yaml" 2>/dev/null | head -1 | sed 's/#.*//' | sed 's/.*:\s*//' | tr -d "\"' " | xargs)
      if [ -n "$offer_path" ] && [ "$offer_path" != "null" ]; then
        offer_name="$offer_path"
      else
        # Derive from path relative to ecosystem root
        offer_name="${check_dir#$ECOSYSTEM_ROOT/}"
      fi
      return 0
    fi
    check_dir=$(dirname "$check_dir")
  done
  return 1
}

# ─── Detect offer by finding most recently updated helix-state.yaml ──────
detect_most_recent_offer() {
  local latest_file
  latest_file=$(find "$ECOSYSTEM_ROOT" -name "helix-state.yaml" \
    -not -path "*/.git/*" \
    -not -path "*/.claude/*" \
    -not -path "*/node_modules/*" \
    -not -path "*/templates/*" \
    -not -path "*/lucapimenta/*" \
    -not -path "*/tool-results/*" \
    -newer "$ECOSYSTEM_ROOT" \
    -type f 2>/dev/null | while read -r f; do
      echo "$(stat -f '%m' "$f" 2>/dev/null || stat -c '%Y' "$f" 2>/dev/null) $f"
    done | sort -rn | head -1 | awk '{print $2}')

  if [ -n "$latest_file" ]; then
    local offer_dir
    offer_dir=$(dirname "$latest_file")
    detect_from_cwd "$offer_dir"
    return $?
  fi
  return 1
}

# ─── Enrich phase from project_state.yaml if missing ────────────────────
enrich_from_project_state() {
  local offer_dir="$ECOSYSTEM_ROOT/$offer_name"
  [ ! -f "$offer_dir/project_state.yaml" ] && return

  if [ -z "$phase_label" ] || [ "$phase_label" = "IDLE" ]; then
    local ps_phase
    ps_phase=$(grep -E '^\s*current_phase\s*:' "$offer_dir/project_state.yaml" 2>/dev/null | head -1 | sed 's/.*:\s*//' | tr -d "\"' " | tr '[:lower:]' '[:upper:]')
    if [ -z "$ps_phase" ] || [ "$ps_phase" = "NULL" ]; then
      ps_phase=$(grep -E '^\s*phase\s*:' "$offer_dir/project_state.yaml" 2>/dev/null | head -1 | sed 's/.*:\s*//' | tr -d "\"' " | tr '[:lower:]' '[:upper:]')
    fi
    if [ -n "$ps_phase" ] && [ "$ps_phase" != "NULL" ]; then
      phase_label="$ps_phase"
    fi
  fi
}

# ─── Detection chain (persistent only) ──────────────────────────────────

# 1. Try cwd walk-up (most accurate — user is IN the offer directory)
if [ -n "$cwd" ]; then
  detect_from_cwd "$cwd"
fi

# 2. If no offer found, find most recently updated offer
if [ -z "$offer_name" ]; then
  detect_most_recent_offer
fi

# 3. Enrich phase from project_state.yaml
if [ -n "$offer_name" ]; then
  enrich_from_project_state
fi

# 4. Map phase to persona
if [ -n "$phase_label" ]; then
  persona=$(map_phase_to_persona "$phase_label")
fi

# ─── Display helpers ─────────────────────────────────────────────────────

# Shorten offer name: just the last segment (offer name, not full path)
short_offer=""
if [ -n "$offer_name" ]; then
  short_offer=$(basename "$offer_name")
fi

# Shorten cwd: replace $HOME with ~
if [ -n "$cwd" ]; then
  short_cwd="${cwd/#$HOME/~}"
else
  short_cwd="~"
fi

# Git branch (non-blocking)
git_branch=""
target_dir="${cwd:-$HOME}"
if git -C "$target_dir" rev-parse --git-dir >/dev/null 2>&1; then
  branch=$(GIT_OPTIONAL_LOCKS=0 git -C "$target_dir" symbolic-ref --short HEAD 2>/dev/null)
  if [ -n "$branch" ]; then
    git_branch=" ($branch)"
  fi
fi

# Context percentage
ctx_indicator=""
if [ -n "$used_pct" ] && [ "$used_pct" != "null" ]; then
  used_int=$(printf "%.0f" "$used_pct" 2>/dev/null || echo "0")
  ctx_indicator="${used_int}% ctx"
fi

# Model short name
model_short=""
if [ -n "$model" ] && [ "$model" != "null" ]; then
  model_short="$model"
fi

# Vim mode
vim_indicator=""
if [ -n "$vim_mode" ] && [ "$vim_mode" != "null" ]; then
  vim_indicator="$vim_mode"
fi

# Session name
session_indicator=""
if [ -n "$session_name" ] && [ "$session_name" != "null" ]; then
  session_indicator="$session_name"
fi

# ─── Compose final status line ──────────────────────────────────────────

if [ -n "$persona" ] && [ -n "$short_offer" ]; then
  # AIOS mode: [PERSONA] offer | PHASE | ctx% | cwd (branch)
  parts="[${persona}] ${short_offer} | ${phase_label}"

  if [ -n "$ctx_indicator" ]; then
    parts="${parts} | ${ctx_indicator}"
  fi

  parts="${parts} | ${short_cwd}${git_branch}"

  printf "%s" "$parts"
else
  # Fallback: cwd (branch) | ctx% | model
  parts="${short_cwd}${git_branch}"

  if [ -n "$ctx_indicator" ]; then
    parts="${parts} | ${ctx_indicator}"
  fi
  if [ -n "$model_short" ]; then
    parts="${parts} | ${model_short}"
  fi
  if [ -n "$vim_indicator" ]; then
    parts="${parts} | ${vim_indicator}"
  fi
  if [ -n "$session_indicator" ]; then
    parts="${parts} | ${session_indicator}"
  fi

  printf "%s" "$parts"
fi
