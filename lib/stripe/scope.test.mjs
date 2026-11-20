// Samples of lib/stripe/scope.mjs (core step 818-7): an element's key speaks for that element only; the node key for any.
// `npm run test:stripe-scope`, part of the prebuild. The negative control: the doors before 818-7 took the element from the body.
import assert from 'node:assert/strict'
import { scopeElement, seesSession } from './scope.mjs'

const NODE = { kind: 'node' }
const SHOP = { kind: 'element', id: 'shop' }
let passed = 0
const t = (name, fn) => {
  try { fn(); passed += 1; console.log(`  ✓ ${name}`) } catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1 }
}

t('an element sells in its own name: the id comes from its key', () => {
  assert.deepEqual(scopeElement({ reference: 'o-1' }, SHOP), { ok: true, input: { reference: 'o-1', element: 'shop' } })
  assert.deepEqual(scopeElement({ element: 'shop', reference: 'o-1' }, SHOP).input.element, 'shop')
  assert.deepEqual(scopeElement(null, SHOP), { ok: true, input: { element: 'shop' } })
})
t('an element naming another element is refused', () => {
  const r = scopeElement({ element: 'root', reference: 'o-1' }, SHOP)
  assert.equal(r.ok, false)
  assert.equal(r.status, 403)
  assert.equal(r.body.error, 'not_your_element')
})
t('the node key speaks for any element, as before', () => {
  assert.deepEqual(scopeElement({ element: 'root' }, NODE), { ok: true, input: { element: 'root' } })
})
t('a session read by status: an element sees its own only, the node any', () => {
  assert.equal(seesSession({ element: 'shop' }, SHOP), true)
  assert.equal(seesSession({ element: 'root' }, SHOP), false)
  assert.equal(seesSession({ element: null }, SHOP), false)
  assert.equal(seesSession({ element: 'root' }, NODE), true)
})
t('NEGATIVE CONTROL: before 818-7 the body named the element, whoever called', () => {
  const old = (input) => ({ ok: true, input })
  assert.equal(old({ element: 'root' }).input.element, 'root')
  assert.notEqual(scopeElement({ element: 'root' }, SHOP).ok, old({ element: 'root' }).ok)
})
console.log(`stripe scope: ${passed} passed${process.exitCode ? ', FAILURES above' : ''}`)
