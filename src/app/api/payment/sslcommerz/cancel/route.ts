import { NextResponse } from "next/server";
import { handleSslcommerzFailure } from "@/lib/sslcommerz-order";

async function handle(request: Request) {
  let tranId = "";
  if (request.method === "POST") {
    const fd = await request.formData();
    tranId = String(fd.get("tran_id") ?? "");
  } else {
    tranId = new URL(request.url).searchParams.get("tran_id") ?? "";
  }

  await handleSslcommerzFailure(tranId, "cancelled");
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  const target = tranId ? `/account/orders/${encodeURIComponent(tranId)}?payment=cancelled` : `/checkout?payment=cancelled`;
  return NextResponse.redirect(`${origin}${target}`, 303);
}

export const POST = handle;
export const GET = handle;
