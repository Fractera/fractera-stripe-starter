// @api create a Stripe Checkout payment link for an element of the node
import { NextRequest, NextResponse } from "next/server"
import { needNodeKey, nodeCaller, NO_STORE } from "@/lib/node-key"
import { scopeElement } from "@/lib/stripe/scope.mjs"
import { handle } from "./stripe-checkout.mjs"

// DOOR stripe-checkout — made by `npm run door:add` (node step 548-16). The other elements of the node call it on the machine's loopback
// (http://127.0.0.1:<port>/api/stripe-checkout) with the header X-Node-Key; the gate of proxy.ts lets the loopback through, the key decides
// here and names the caller (core step 818-7). The work is `handle()` in ./stripe-checkout.mjs — this file only checks the key and turns JSON in and out.
// 🔒 An element's key sells in that element's name only — the element comes from the key, never from the body (lib/stripe/scope.mjs).
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const caller = nodeCaller(req.headers.get("x-node-key"))
  if (!caller) return needNodeKey()
  let input: unknown
  try { input = await req.json() } catch {
    return NextResponse.json({ error: "bad_request", reason: "the body must be JSON" }, { status: 400, headers: NO_STORE })
  }
  const scoped = scopeElement(input, caller)
  if (!scoped.ok) return NextResponse.json(scoped.body, { status: scoped.status, headers: NO_STORE })
  const { status, body } = await handle(scoped.input)
  return NextResponse.json(body, { status, headers: NO_STORE })
}
