// @api receive signed Stripe events and record finished payments
import { NextRequest, NextResponse } from "next/server"
import { receive } from "./stripe-webhook.mjs"

// DOOR stripe-webhook (node step 573-3). Stripe calls it from the internet with no node key; the gate of proxy.ts lets it through
// (PUBLIC_API_PREFIXES) and the signature decides here. The body is read RAW — the signature check fails on a parsed and re-written body.
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const { status, body } = await receive(raw, req.headers.get("stripe-signature"))
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })
}
