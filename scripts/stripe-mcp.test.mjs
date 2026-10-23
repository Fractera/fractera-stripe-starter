// npm run test:mcp-stripe — samples of scripts/stripe-mcp.mjs in a temporary folder, without network (node step 573-4).
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'stripe-mcp.mjs')
const dir = mkdtempSync(join(tmpdir(), 'stripe-mcp-'))
const run = () => spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8', env: { ...process.env, ELEMENT_DIR: dir } })
const mcp = () => JSON.parse(readFileSync(join(dir, '.mcp.json'), 'utf8'))
const FAKE = 'rk_test_' + 'A1b2C3d4E5f6G7h8I9j0'
let passed = 0
const check = (name, fn) => { fn(); passed++; console.log(`ok - ${name}`) }

try {
  check('no key: the server is not configured, no file appears', () => {
    writeFileSync(join(dir, '.env.local'), 'PORT=24691\n')
    const r = run()
    assert.equal(r.status, 0)
    assert.match(r.stdout, /===MCP_STRIPE_OFF===/)
    assert.equal(existsSync(join(dir, '.mcp.json')), false)
  })
  check('agent key: the server stripe-agent with the bearer header; the key is never printed', () => {
    writeFileSync(join(dir, '.env.local'), `PORT=24691\nSTRIPE_AGENT_API_KEY=${FAKE}\n`)
    const r = run()
    assert.equal(r.status, 0)
    assert.match(r.stdout, /===MCP_STRIPE_ON===.*test mode/)
    assert.equal(r.stdout.includes(FAKE), false)
    const s = mcp().mcpServers['stripe-agent']
    assert.deepEqual(s, { type: 'http', url: 'https://mcp.stripe.com', headers: { Authorization: `Bearer ${FAKE}` } })
  })
  check('a secret key in the agent field is refused, the file stays as it was', () => {
    const before = readFileSync(join(dir, '.mcp.json'), 'utf8')
    writeFileSync(join(dir, '.env.local'), 'STRIPE_AGENT_API_KEY=sk_test_A1b2C3d4E5f6G7h8I9j0\n')
    const r = run()
    assert.equal(r.status, 2)
    assert.match(r.stdout, /===MCP_STRIPE_FAILED===/)
    assert.equal(readFileSync(join(dir, '.mcp.json'), 'utf8'), before)
  })
  check('the key removed: only stripe-agent leaves, another server stays', () => {
    const other = { command: 'node', args: ['x.mjs'] }
    writeFileSync(join(dir, '.mcp.json'), JSON.stringify({ mcpServers: { other, 'stripe-agent': mcp().mcpServers['stripe-agent'] } }))
    writeFileSync(join(dir, '.env.local'), 'PORT=24691\n')
    const r = run()
    assert.match(r.stdout, /===MCP_STRIPE_OFF===/)
    assert.deepEqual(mcp().mcpServers, { other })
  })
  console.log(`===TEST_MCP_STRIPE_OK=== ${passed} checks`)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
