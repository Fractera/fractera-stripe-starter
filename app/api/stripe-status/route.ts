// @api read the status of a Stripe Checkout payment by its id
import { NextRequest, NextResponse } from "next/server"
import { needNodeKey, nodeCaller, NO_STORE } from "@/lib/node-key"
import { seesSession } from "@/lib/stripe/scope.mjs"
import { handle } from "./stripe-status.mjs"

// DOOR stripe-status — made by `npm run door:add` (node step 548-16). The other elements of the node call it on the machine's loopback
// (http://127.0.0.1:<port>/api/stripe-status) with the header X-Node-Key; the gate of proxy.ts lets the loopback through, the key decides
// here and names the caller (core step 818-7). The work is `handle()` in ./stripe-status.mjs — this file only checks the key and turns JSON in and out.
// 🔒 An element's key sees that element's Checkout sessions only; another's answers as unknown (lib/stripe/scope.mjs).
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const caller = nodeCaller(req.headers.get("x-node-key"))
  if (!caller) return needNodeKey()
  const input = Object.fromEntries(req.nextUrl.searchParams)
  const { status, body } = await handle(input)
  if (status === 200 && !seesSession(body, caller)) {
    return NextResponse.json({ error: "not_found", reason: "no such Checkout session of this element" }, { status: 404, headers: NO_STORE })
  }
  return NextResponse.json(body, { status, headers: NO_STORE })
}
