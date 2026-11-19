import "server-only";

export type SslcommerzInitParams = {
  tranId: string;
  amount: number;
  productName: string;
  productCategory: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerPostcode?: string;
  preferBkash?: boolean;
  baseUrl: string;
};

export type SslcommerzInitResult =
  | { ok: true; gatewayUrl: string; sessionKey: string }
  | { ok: false; error: string };

export type SslcommerzValidationResult =
  | { ok: true; status: string; amount: number; tranId: string; valId: string; bankTranId: string; cardType: string }
  | { ok: false; error: string };

function getConfig() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID?.trim();
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD?.trim();
  const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";
  const apiBase = isLive ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com";
  return { storeId, storePassword, isLive, apiBase };
}

export function isSslcommerzConfigured(): boolean {
  const { storeId, storePassword } = getConfig();
  return Boolean(storeId && storePassword);
}

export async function initSslcommerzSession(params: SslcommerzInitParams): Promise<SslcommerzInitResult> {
  const { storeId, storePassword, apiBase } = getConfig();
  if (!storeId || !storePassword) {
    return { ok: false, error: "SSLCommerz credentials are not configured." };
  }

  const origin = params.baseUrl.replace(/\/$/, "");
  const body = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: String(params.amount),
    currency: "BDT",
    tran_id: params.tranId,
    success_url: `${origin}/api/payment/sslcommerz/success`,
    fail_url: `${origin}/api/payment/sslcommerz/fail`,
    cancel_url: `${origin}/api/payment/sslcommerz/cancel`,
    ipn_url: `${origin}/api/payment/sslcommerz/ipn`,
    shipping_method: "Courier",
    product_name: params.productName.slice(0, 250),
    product_category: params.productCategory.slice(0, 50),
    product_profile: "physical-goods",
    cus_name: params.customerName,
    cus_email: params.customerEmail,
    cus_add1: params.customerAddress,
    cus_city: params.customerCity,
    cus_postcode: params.customerPostcode || "1212",
    cus_country: "Bangladesh",
    cus_phone: params.customerPhone,
    ship_name: params.customerName,
    ship_add1: params.customerAddress,
    ship_city: params.customerCity,
    ship_postcode: params.customerPostcode || "1212",
    ship_country: "Bangladesh",
    ...(params.preferBkash ? { multi_card_name: "bkash" } : {}),
  });

  try {
    const res = await fetch(`${apiBase}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });
    const data = (await res.json()) as { status?: string; GatewayPageURL?: string; sessionkey?: string; failedreason?: string };
    if (data.status === "SUCCESS" && data.GatewayPageURL) {
      return { ok: true, gatewayUrl: data.GatewayPageURL, sessionKey: data.sessionkey ?? "" };
    }
    return { ok: false, error: data.failedreason || "Unable to start SSLCommerz payment session." };
  } catch (err) {
    console.error("SSLCommerz init error:", err);
    return { ok: false, error: "Could not reach SSLCommerz payment gateway. Please try again." };
  }
}

export async function validateSslcommerzPayment(valId: string): Promise<SslcommerzValidationResult> {
  const { storeId, storePassword, apiBase } = getConfig();
  if (!storeId || !storePassword) {
    return { ok: false, error: "SSLCommerz credentials are not configured." };
  }

  const url = `${apiBase}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(storePassword)}&v=1&format=json`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as {
      status?: string;
      amount?: string;
      tran_id?: string;
      val_id?: string;
      bank_tran_id?: string;
      card_type?: string;
    };
    if ((data.status === "VALID" || data.status === "VALIDATED") && data.tran_id) {
      return {
        ok: true,
        status: data.status,
        amount: Math.round(Number(data.amount ?? 0)),
        tranId: data.tran_id,
        valId: data.val_id ?? valId,
        bankTranId: data.bank_tran_id ?? "",
        cardType: data.card_type ?? "SSLCommerz",
      };
    }
    return { ok: false, error: `Validation failed (${data.status ?? "UNKNOWN"})` };
  } catch (err) {
    console.error("SSLCommerz validation error:", err);
    return { ok: false, error: "Could not validate SSLCommerz payment." };
  }
}
