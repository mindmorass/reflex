#!/bin/bash
# Reflex Claude Code Plugin
#
# This is now an official Claude Code plugin.
#
# Installation options:
#
# 1. Local testing:
#    claude --plugin-dir /path/to/reflex
#
# 2. Add as a marketplace and install:
#    /plugin marketplace add mindmorass/reflex
#    /plugin install reflex
#
# 3. Direct plugin installation (if already in a marketplace):
#    /plugin install reflex
#
# For more info: https://github.com/mindmorass/reflex

echo "[reflex] This is a Claude Code plugin."
echo ""
echo "To install, use one of these methods in Claude Code:"
echo ""
echo "  1. Test locally:"
echo "     claude --plugin-dir $(pwd)"
echo ""
echo "  2. Add marketplace and install:"
echo "     /plugin marketplace add mindmorass/reflex"
echo "     /plugin install reflex"
echo ""
echo "See README.md for more details."
