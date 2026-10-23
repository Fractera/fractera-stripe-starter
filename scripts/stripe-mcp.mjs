// npm run mcp:stripe — the Stripe MCP server for this element's own agent (node step 573-4).
//
// Stripe's remote MCP server (https://mcp.stripe.com) gives an agent tools over the owner's Stripe account: search the API, read and write
// objects, search the docs (docs.stripe.com/mcp). An autonomous agent authenticates with an AGENT API key: a restricted key (`rk_…`) tagged
// for agents when it is created; Stripe applies approval rules to it, so refunds, transfers and account changes wait for a reviewer
// (docs.stripe.com/keys, «API keys for autonomous agents»; from December 2026 MCP accepts only agent keys or OAuth).
//
// The key is entered by the person on the node screen (Settings → Payments → Web2) and lands in this element's `.env.local` as
// STRIPE_AGENT_API_KEY. The node's bridge starts this agent with the node's environment, not this element's, so `${VAR}` in `.mcp.json`
// would stay empty. This script writes the project file `.mcp.json` (never in git: `.gitignore`) with the server `stripe-agent`, and
// `.claude/settings.json` approves that server in advance so a session under pm2 never stops on the approval question. No key → the
// server is removed and nothing tries to connect. The key is never printed.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ELEMENT = resolve(process.env.ELEMENT_DIR || join(dirname(fileURLToPath(import.meta.url)), '..'))
const SERVER = 'stripe-agent'
const AGENT_KEY = /^rk_(test|live)_[A-Za-z0-9]{10,250}$/
const envText = (() => { try { return readFileSync(join(ELEMENT, '.env.local'), 'utf8') } catch { return '' } })()
const key = (envText.match(/^STRIPE_AGENT_API_KEY=(.*)$/m) ?? [])[1]?.trim() ?? ''
const file = join(ELEMENT, '.mcp.json')
let config = {}
try { config = JSON.parse(readFileSync(file, 'utf8')) } catch { /* no file yet */ }
config.mcpServers = config.mcpServers && typeof config.mcpServers === 'object' ? config.mcpServers : {}

if (!key) {
  delete config.mcpServers[SERVER]
  if (Object.keys(config.mcpServers).length) writeFileSync(file, JSON.stringify(config, null, 2) + '\n')
  else if (existsSync(file)) rmSync(file)
  console.log(`===MCP_STRIPE_OFF=== no STRIPE_AGENT_API_KEY in .env.local: the server ${SERVER} is not configured`)
  process.exit(0)
}
if (!AGENT_KEY.test(key)) {
  console.log('===MCP_STRIPE_FAILED=== STRIPE_AGENT_API_KEY is not an agent key: Stripe agent keys are restricted keys rk_test_… or rk_live_…')
  process.exit(2)
}
config.mcpServers[SERVER] = { type: 'http', url: 'https://mcp.stripe.com', headers: { Authorization: `Bearer ${key}` } }
writeFileSync(file, JSON.stringify(config, null, 2) + '\n')
console.log(`===MCP_STRIPE_ON=== the server ${SERVER} → https://mcp.stripe.com with the agent key (${key.includes('_live_') ? 'live' : 'test'} mode); it starts with the next session of this agent`)
