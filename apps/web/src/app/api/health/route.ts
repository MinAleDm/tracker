import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    checks: {
      web: "ok",
    },
    timestamp: new Date().toISOString(),
  });
}
