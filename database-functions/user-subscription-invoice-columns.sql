-- Additive invoice/payment columns on user_subscription, so the Stripe webhook can
-- persist invoice.paid / invoice.payment_failed state and the subscription-status
-- route can surface renewal + last-payment info. Purely additive + idempotent: no
-- existing column or row is touched, existing consumers keep working. Mirrors
-- prisma/schema.prisma (model UserSubscription).

alter table public.user_subscription
  add column if not exists last_invoice_status text,
  add column if not exists last_invoice_at      timestamptz,
  add column if not exists payment_state        text,
  add column if not exists current_period_end   timestamptz;
