# Reflex Plugin Marketplace

A Claude Code plugin marketplace for application development, infrastructure, and data engineering workflows.

## Installation

```
/plugin marketplace add mindmorass/reflex
/plugin install reflex
```

## Available Plugins

| Plugin | Description |
|--------|-------------|
| [reflex](./plugins/reflex) | Opinionated sub-agents and skills for development workflows |

## Structure

```
reflex/
├── .claude-plugin/
│   └── marketplace.json   # Marketplace manifest
└── plugins/
    └── reflex/            # Plugin directory
        ├── .claude-plugin/
        │   └── plugin.json
        ├── agents/        # 10 sub-agents
        ├── skills/        # 26 skills
        ├── commands/      # Slash commands
        └── ...
```

## License

MIT
