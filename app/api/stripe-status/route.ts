// @api read the status of a Stripe Checkout payment by its id
import { NextRequest, NextResponse } from "next/server"
import { needNodeKey, nodeKeyOk, NO_STORE } from "@/lib/node-key"
import { handle } from "./stripe-status.mjs"

// DOOR stripe-status — made by `npm run door:add` (node step 548-16). The other elements of the node call it on the machine's loopback
// (http://127.0.0.1:<port>/api/stripe-status) with the header X-Node-Key; the gate of proxy.ts lets the loopback through, the key decides
// here. The work is `handle()` in ./stripe-status.mjs — this file only checks the key and turns JSON in and out.
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!nodeKeyOk(req.headers.get("x-node-key"))) return needNodeKey()
  const input = Object.fromEntries(req.nextUrl.searchParams)
  const { status, body } = await handle(input)
  return NextResponse.json(body, { status, headers: NO_STORE })
}
