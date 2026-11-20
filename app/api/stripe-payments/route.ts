// @api list the recorded Stripe payments of one element of the node
import { NextRequest, NextResponse } from "next/server"
import { needNodeKey, nodeCaller, NO_STORE } from "@/lib/node-key"
import { scopeElement } from "@/lib/stripe/scope.mjs"
import { handle } from "./stripe-payments.mjs"

// DOOR stripe-payments — made by `npm run door:add` (node step 548-16). The other elements of the node call it on the machine's loopback
// (http://127.0.0.1:<port>/api/stripe-payments) with the header X-Node-Key; the gate of proxy.ts lets the loopback through, the key decides
// here and names the caller (core step 818-7). The work is `handle()` in ./stripe-payments.mjs — this file only checks the key and turns JSON in and out.
// 🔒 An element's key reads that element's payments only — `?element` is taken from the key (lib/stripe/scope.mjs).
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const caller = nodeCaller(req.headers.get("x-node-key"))
  if (!caller) return needNodeKey()
  const scoped = scopeElement(Object.fromEntries(req.nextUrl.searchParams), caller)
  if (!scoped.ok) return NextResponse.json(scoped.body, { status: scoped.status, headers: NO_STORE })
  const { status, body } = await handle(scoped.input)
  return NextResponse.json(body, { status, headers: NO_STORE })
}
