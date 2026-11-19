import { NextResponse } from "next/server";
import { finalizeSslcommerzSuccess, handleSslcommerzFailure } from "@/lib/sslcommerz-order";

export async function POST(request: Request) {
  const fd = await request.formData();
  const status = String(fd.get("status") ?? "");
  const valId = String(fd.get("val_id") ?? "");
  const tranId = String(fd.get("tran_id") ?? "");

  if (status === "VALID" || status === "VALIDATED") {
    if (valId) await finalizeSslcommerzSuccess(valId, tranId);
  } else if (status === "FAILED") {
    await handleSslcommerzFailure(tranId, "failed");
  } else if (status === "CANCELLED") {
    await handleSslcommerzFailure(tranId, "cancelled");
  }

  return NextResponse.json({ received: true });
}
