// WHICH ELEMENT A CALL SPEAKS FOR (core step 818-7, the red team's H6). Before 818-7 every element held the node key, and the doors took
// the selling element from the body: any element could open a checkout in another's name or read another's payments. Now a custom
// element calls with its own key, and `nodeCaller` (lib/node-key.ts) names it: such a call speaks for that element only — its id comes
// from the key, never from the input. The node key (the core, a native element) speaks for any element, as before.

/** The input of a door with `element` taken from the caller; another element named in the input → refused (403). */
export function scopeElement(input, caller) {
  if (!caller || caller.kind !== 'element') return { ok: true, input }
  const given = input && typeof input === 'object' ? String(input.element ?? '').trim() : ''
  if (given && given !== caller.id) {
    return { ok: false, status: 403, body: { error: 'not_your_element', reason: `a call with the key of «${caller.id}» speaks for «${caller.id}» only` } }
  }
  return { ok: true, input: { ...(input && typeof input === 'object' ? input : {}), element: caller.id } }
}

/** May this caller see a Checkout session the door read? An element — only its own; the node — any. */
export function seesSession(body, caller) {
  return !caller || caller.kind !== 'element' || (body && body.element === caller.id)
}
