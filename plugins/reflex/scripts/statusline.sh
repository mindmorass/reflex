#!/bin/bash
# Reflex Status Line for Claude Code
# Mimics Starship prompt configuration from ~/.config/starship.toml

# Color theme: starship (Gruvbox Dark palette)
COLOR="${REFLEX_STATUSLINE_COLOR:-starship}"

# Gruvbox Dark color palette (from starship.toml)
C_RESET='\033[0m'
C_ORANGE='\033[38;5;208m'      # color_orange: #ff6f00
C_YELLOW='\033[38;5;221m'      # color_yellow: #FFDE59
C_SHARP_BLUE='\033[38;5;33m'   # color_sharp_blue: #008cff
C_PURPLE='\033[38;5;141m'      # color_purple: #9959FF
C_RED='\033[38;5;203m'         # color_red: #F15B5B
C_AQUA='\033[38;5;72m'         # color_aqua: #689d6a
C_BLUE='\033[38;5;66m'         # color_blue: #458588
C_BG3='\033[38;5;241m'         # color_bg3: #665c54
C_FG0='\033[38;5;230m'         # color_fg0: #fbf1c7
C_GRAY='\033[38;5;245m'
C_BAR_EMPTY='\033[38;5;238m'

# Legacy color support
case "$COLOR" in
    orange)   C_ACCENT='\033[38;5;173m' ;;
    blue)     C_ACCENT='\033[38;5;74m' ;;
    teal)     C_ACCENT='\033[38;5;66m' ;;
    green)    C_ACCENT='\033[38;5;71m' ;;
    lavender) C_ACCENT='\033[38;5;139m' ;;
    rose)     C_ACCENT='\033[38;5;132m' ;;
    gold)     C_ACCENT='\033[38;5;136m' ;;
    slate)    C_ACCENT='\033[38;5;60m' ;;
    cyan)     C_ACCENT='\033[38;5;37m' ;;
    starship) C_ACCENT="$C_AQUA" ;;
    *)        C_ACCENT="$C_GRAY" ;;
esac

input=$(cat)

# Extract model, directory, and cwd
model=$(echo "$input" | jq -r '.model.display_name // .model.id // "?"')
cwd=$(echo "$input" | jq -r '.cwd // empty')
dir=$(basename "$cwd" 2>/dev/null || echo "?")

# Get workspace profile (like Starship custom.workspace)
workspace="${WORKSPACE_PROFILE:-$(whoami)}"

# Get OS symbol (like Starship os module)
os_symbol="󰀵"  # macOS default from starship.toml

# Get git branch and status (like Starship git_branch and git_status)
branch=""
git_status_indicators=""
if [[ -n "$cwd" && -d "$cwd" ]]; then
    branch=$(git -C "$cwd" branch --show-current 2>/dev/null)
    if [[ -n "$branch" ]]; then
        # Count uncommitted files
        file_count=$(git -C "$cwd" --no-optional-locks status --porcelain -uno 2>/dev/null | wc -l | tr -d ' ')

        # Get ahead/behind status
        upstream=$(git -C "$cwd" rev-parse --abbrev-ref @{upstream} 2>/dev/null)
        if [[ -n "$upstream" ]]; then
            counts=$(git -C "$cwd" rev-list --left-right --count HEAD...@{upstream} 2>/dev/null)
            ahead=$(echo "$counts" | cut -f1)
            behind=$(echo "$counts" | cut -f2)

            # Build status indicators
            [[ "${file_count:-0}" -gt 0 ]] && git_status_indicators+="*${file_count}"
            [[ "${ahead:-0}" -gt 0 ]] && git_status_indicators+="↑${ahead}"
            [[ "${behind:-0}" -gt 0 ]] && git_status_indicators+="↓${behind}"
        else
            [[ "$file_count" -gt 0 ]] && git_status_indicators+="*${file_count}"
        fi
    fi
fi

# Check for Kubernetes context (when kubeon is set, like Starship)
k8s_info=""
if [[ -n "$kubeon" ]] && command -v kubectl &>/dev/null; then
    k8s_ctx=$(kubectl config current-context 2>/dev/null)
    k8s_ns=$(kubectl config view --minify --output 'jsonpath={..namespace}' 2>/dev/null)
    [[ -z "$k8s_ns" ]] && k8s_ns="default"
    k8s_info="${k8s_ctx} [${k8s_ns}]"
fi

# Check for GCloud context (when gcpon is set, like Starship)
gcp_info=""
if [[ -n "$gcpon" ]] && command -v gcloud &>/dev/null; then
    gcp_account=$(gcloud config get-value account 2>/dev/null)
    gcp_project=$(gcloud config get-value project 2>/dev/null)
    [[ -n "$gcp_account" && -n "$gcp_project" ]] && gcp_info="${gcp_account}@${gcp_project}"
fi

# Check for Terraform workspace (like Starship terraform module)
tf_info=""
if [[ -n "$cwd" && -f "$cwd/.terraform/environment" ]]; then
    tf_workspace=$(cat "$cwd/.terraform/environment" 2>/dev/null)
    [[ -n "$tf_workspace" ]] && tf_info="[${tf_workspace}]"
fi

# Get transcript path for context calculation
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty')

max_context=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')
max_k=$((max_context / 1000))

# Calculate context bar from transcript
baseline=20000
bar_width=10

if [[ -n "$transcript_path" && -f "$transcript_path" ]]; then
    context_length=$(jq -s '
        map(select(.message.usage and .isSidechain != true and .isApiErrorMessage != true)) |
        last |
        if . then
            (.message.usage.input_tokens // 0) +
            (.message.usage.cache_read_input_tokens // 0) +
            (.message.usage.cache_creation_input_tokens // 0)
        else 0 end
    ' < "$transcript_path")

    if [[ "$context_length" -gt 0 ]]; then
        pct=$((context_length * 100 / max_context))
        pct_prefix=""
    else
        pct=$((baseline * 100 / max_context))
        pct_prefix="~"
    fi
else
    pct=$((baseline * 100 / max_context))
    pct_prefix="~"
fi

[[ $pct -gt 100 ]] && pct=100

bar=""
for ((i=0; i<bar_width; i++)); do
    bar_start=$((i * 10))
    progress=$((pct - bar_start))
    if [[ $progress -ge 8 ]]; then
        bar+="${C_ACCENT}█${C_RESET}"
    elif [[ $progress -ge 3 ]]; then
        bar+="${C_ACCENT}▄${C_RESET}"
    else
        bar+="${C_BAR_EMPTY}░${C_RESET}"
    fi
done

ctx="${bar} ${C_GRAY}${pct_prefix}${pct}% of ${max_k}k tokens"

# Build output (mimicking Starship format with colored segments)
output=""

# OS + Workspace (orange background in Starship)
output+="${C_ORANGE}${os_symbol} ${workspace}${C_RESET}"

# Directory (yellow background in Starship)
output+=" ${C_YELLOW}📁 ${dir}${C_RESET}"

# Kubernetes (sharp blue background in Starship, only if kubeon)
[[ -n "$k8s_info" ]] && output+=" ${C_SHARP_BLUE}☸ ${k8s_info}${C_RESET}"

# Terraform (purple background in Starship, only if .terraform exists)
[[ -n "$tf_info" ]] && output+=" ${C_PURPLE}󱁢 ${tf_info}${C_RESET}"

# GCloud (red background in Starship, only if gcpon)
[[ -n "$gcp_info" ]] && output+=" ${C_RED} ${gcp_info}${C_RESET}"

# Git (aqua background in Starship)
if [[ -n "$branch" ]]; then
    output+=" ${C_AQUA} ${branch}"
    [[ -n "$git_status_indicators" ]] && output+=" ${git_status_indicators}"
    output+="${C_RESET}"
fi

# Model (using blue like language versions in Starship)
output+=" ${C_BLUE}${model}${C_RESET}"

# Time (gray background in Starship)
current_time=$(date +%H:%M:%S)
output+=" ${C_GRAY}⏱ ${current_time}${C_RESET}"

# Context usage bar
output+=" ${ctx}${C_RESET}"

printf '%b\n' "$output"

# Show last user message on second line
if [[ -n "$transcript_path" && -f "$transcript_path" ]]; then
    plain_output="${model} | 📁${dir}"
    [[ -n "$branch" ]] && plain_output+=" | 🔀${branch} ${git_status}"
    plain_output+=" | xxxxxxxxxx ${pct}% of ${max_k}k tokens"
    max_len=${#plain_output}
    last_user_msg=$(jq -rs '
        def is_unhelpful:
            startswith("[Request interrupted") or
            startswith("[Request cancelled") or
            . == "";
        [.[] | select(.type == "user") |
         select(.message.content | type == "string" or
                (type == "array" and any(.[]; .type == "text")))] |
        reverse |
        map(.message.content |
            if type == "string" then .
            else [.[] | select(.type == "text") | .text] | join(" ") end |
            gsub("\n"; " ") | gsub("  +"; " ")) |
        map(select(is_unhelpful | not)) |
        first // ""
    ' < "$transcript_path" 2>/dev/null)

    if [[ -n "$last_user_msg" ]]; then
        if [[ ${#last_user_msg} -gt $max_len ]]; then
            echo "💬 ${last_user_msg:0:$((max_len - 3))}..."
        else
            echo "💬 ${last_user_msg}"
        fi
    fi
fi
