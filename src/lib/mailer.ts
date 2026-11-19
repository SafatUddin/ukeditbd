import "server-only";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export type ManualBkashEmailPayload = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  bkashSender: string;
  bkashTrxId: string;
  items: { productName: string; variantLabel: string; quantity: number; unitPrice: number; preorder: boolean }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  expectedAdvance: number;
  dueOnDelivery: number;
  hasPreorder: boolean;
  adminOrderUrl: string;
};

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getTransporter() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return null;

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendManualBkashAdminEmail(payload: ManualBkashEmailPayload): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[mailer] SMTP_USER / SMTP_PASS not configured — skipped admin bKash notification for ${payload.orderNumber}`);
    return;
  }

  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  const recipients = admins.map((a) => a.email).filter(Boolean);
  if (!recipients.length) return;

  const from = process.env.SMTP_FROM?.trim() || `The UK Edit BD <${process.env.SMTP_USER}>`;
  const subject = `[Action Required] Verify bKash Payment — Order ${payload.orderNumber} (${payload.customerName})`;

  const itemRowsHtml = payload.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">
          ${escapeHtml(i.productName)}${i.preorder ? ` <span style="color:#d9245f;font-size:11px;font-weight:600;">[PRE-ORDER]</span>` : ""}
          <div style="color:#6b7280;font-size:12px;">${escapeHtml(i.variantLabel)}</div>
        </td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatPrice(i.unitPrice * i.quantity)}</td>
      </tr>`,
    )
    .join("");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;color:#111827;line-height:1.5;">
    <div style="background:#0a2a5e;color:#ffffff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#c39a4c;">The UK Edit BD · Admin Alert</p>
      <h1 style="margin:6px 0 0;font-size:20px;">Manual bKash Payment Submitted — ${escapeHtml(payload.orderNumber)}</h1>
    </div>

    <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
      <p style="margin-top:0;">A customer has placed an order and submitted a manual <strong>bKash Send Money</strong> payment. Please check your bKash app/SMS to verify the transaction and update the status in the Orders table to <strong>Payment Verified</strong>.</p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:18px 0;">
        <p style="margin:4px 0;">Customer Name: <strong>${escapeHtml(payload.customerName)}</strong></p>
        <p style="margin:4px 0;">Customer Phone: <strong>${escapeHtml(payload.customerPhone)}</strong></p>
        <p style="margin:4px 0;">bKash Sender Number: <strong>${escapeHtml(payload.bkashSender)}</strong></p>
        <p style="margin:4px 0;">bKash TrxID: <strong style="font-family:monospace;font-size:15px;color:#d9245f;">${escapeHtml(payload.bkashTrxId)}</strong></p>
        <p style="margin:10px 0 0;padding-top:10px;border-top:1px solid #e5e7eb;">
          Expected bKash Amount: <strong>${formatPrice(payload.expectedAdvance)}</strong>
          ${payload.hasPreorder ? ` (20% Pre-Order Advance · Remaining ${formatPrice(payload.dueOnDelivery)} due on delivery)` : " (100% Full Payment)"}
        </p>
      </div>

      <h2 style="font-size:15px;margin:20px 0 8px;color:#0a2a5e;">Order Items</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;text-align:left;">
            <th style="padding:8px 10px;">Item</th>
            <th style="padding:8px 10px;text-align:center;">Qty</th>
            <th style="padding:8px 10px;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRowsHtml}</tbody>
      </table>

      <div style="margin-top:14px;text-align:right;font-size:14px;">
        <p style="margin:3px 0;color:#6b7280;">Subtotal: ${formatPrice(payload.subtotal)}</p>
        <p style="margin:3px 0;color:#6b7280;">Delivery: ${formatPrice(payload.shippingFee)}</p>
        <p style="margin:6px 0 0;font-size:16px;"><strong>Total Price: ${formatPrice(payload.total)}</strong></p>
      </div>

      <div style="margin-top:24px;text-align:center;">
        <a href="${escapeHtml(payload.adminOrderUrl)}" style="display:inline-block;background:#0a2a5e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">
          Open Order &amp; Verify Payment
        </a>
      </div>

      <p style="margin-top:20px;font-size:12px;color:#6b7280;">
        After verifying the TrxID in bKash, open this order in your Admin panel and click
        <strong>${payload.hasPreorder ? "Confirm 20% advance" : "Record full payment"}</strong> to update the status in the Orders table to payment verified.
      </p>
    </div>
  </div>`;

  const text = [
    `Manual bKash Payment Submitted — Order ${payload.orderNumber}`,
    ``,
    `Customer Name: ${payload.customerName}`,
    `Customer Phone: ${payload.customerPhone}`,
    `bKash Sender Number: ${payload.bkashSender}`,
    `bKash TrxID: ${payload.bkashTrxId}`,
    `Expected bKash Amount: ${formatPrice(payload.expectedAdvance)}${payload.hasPreorder ? ` (20% advance; remaining ${formatPrice(payload.dueOnDelivery)} on delivery)` : ""}`,
    ``,
    `Order Items:`,
    ...payload.items.map((i) => `- ${i.productName} (${i.variantLabel}) x${i.quantity} = ${formatPrice(i.unitPrice * i.quantity)}${i.preorder ? " [PRE-ORDER]" : ""}`),
    ``,
    `Total Price: ${formatPrice(payload.total)}`,
    ``,
    `Please verify the TrxID in bKash and update the status in the Orders table to Payment Verified:`,
    payload.adminOrderUrl,
  ].join("\n");

  try {
    await transporter.sendMail({
      from,
      to: recipients.join(", "),
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error(`[mailer] Failed to send admin bKash email for ${payload.orderNumber}:`, err);
  }
}
