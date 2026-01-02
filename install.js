#!/usr/bin/env node

/**
 * Reflex Claude Code Plugin
 *
 * This is now an official Claude Code plugin.
 *
 * Installation options:
 *
 * 1. Local testing:
 *    claude --plugin-dir /path/to/reflex
 *
 * 2. Add as a marketplace and install:
 *    /plugin marketplace add mindmorass/reflex
 *    /plugin install reflex
 *
 * 3. Direct plugin installation (if already in a marketplace):
 *    /plugin install reflex
 *
 * For more info: https://github.com/mindmorass/reflex
 */

console.log('[reflex] This is a Claude Code plugin.');
console.log('');
console.log('To install, use one of these methods in Claude Code:');
console.log('');
console.log('  1. Test locally:');
console.log('     claude --plugin-dir ' + process.cwd());
console.log('');
console.log('  2. Add marketplace and install:');
console.log('     /plugin marketplace add mindmorass/reflex');
console.log('     /plugin install reflex');
console.log('');
console.log('See README.md for more details.');
