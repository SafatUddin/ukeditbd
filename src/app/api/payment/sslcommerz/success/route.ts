import { NextResponse } from "next/server";
import { finalizeSslcommerzSuccess } from "@/lib/sslcommerz-order";

async function handle(request: Request) {
  let valId = "";
  let tranId = "";
  if (request.method === "POST") {
    const fd = await request.formData();
    valId = String(fd.get("val_id") ?? "");
    tranId = String(fd.get("tran_id") ?? "");
  } else {
    const sp = new URL(request.url).searchParams;
    valId = sp.get("val_id") ?? "";
    tranId = sp.get("tran_id") ?? "";
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  if (!valId) {
    return NextResponse.redirect(`${origin}/account/orders?payment=failed`, 303);
  }

  const res = await finalizeSslcommerzSuccess(valId, tranId);
  if (res.ok) {
    return NextResponse.redirect(`${origin}/account/orders/${encodeURIComponent(res.orderNumber)}?placed=1&paid=1`, 303);
  }
  const target = res.orderNumber ? `/account/orders/${encodeURIComponent(res.orderNumber)}?payment=failed` : `/account/orders?payment=failed`;
  return NextResponse.redirect(`${origin}${target}`, 303);
}

export const POST = handle;
export const GET = handle;
