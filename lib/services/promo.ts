import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { clearFeatureLimitsCache } from "@/lib/subscription-features";

// Server-side promo-code redemption for already-logged-in users. The signup
// flows validate + apply promo codes inline against the browser client; this is
// the equivalent path for an existing account (profile -> Subscription tab),
// using the service-role client so usage counts span all users and writes are
// not subject to RLS. Each promo grants a plan for `duration_months`, so a
// second code STACKS onto the current expiry rather than replacing it.

export type RedeemReason =
  | "invalid"
  | "expired"
  | "maxUsed"
  | "alreadyRedeemed"
  | "invalidEmail"
  | "error";

export type RedeemResult =
  | { ok: true; planName: string; endDate: string }
  | { ok: false; reason: RedeemReason; message: string };

// Add `months` to a base date, mirroring the year/month math used in the signup
// flow (components/auth/signup-form-v2.tsx:1352-1363) so durations behave
// identically whether redeemed at signup or later.
function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  if (months >= 12) {
    d.setFullYear(d.getFullYear() + Math.floor(months / 12));
    const remaining = months % 12;
    if (remaining > 0) d.setMonth(d.getMonth() + remaining);
  } else {
    d.setMonth(d.getMonth() + months);
  }
  return d;
}

export type ValidateResult =
  | { valid: true; planName: string; durationMonths: number }
  | { valid: false; reason: RedeemReason; message: string };

/**
 * Validate-only promo check for the PRE-AUTH signup flow (no account yet): load the
 * active code and check expiry, the global max-uses cap, and email/domain
 * eligibility. It does NOT touch per-user usage (there is no user to count) and does
 * NOT redeem — redeemPromoCode remains the single write path. Mirrors steps 1–3 + 5
 * of redeemPromoCode; kept separate so the live redeem path is untouched.
 */
export async function validatePromoCode({
  code,
  email,
}: {
  code: string;
  email?: string | null;
}): Promise<ValidateResult> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return { valid: false, reason: "invalid", message: "Please enter a promo code." };
  }

  try {
    const { data: promo, error: promoError } = await supabaseAdmin
      .from("promo_code")
      .select("*, subscription:subscription_id (id, title)")
      .eq("code", normalizedCode)
      .eq("active", true)
      .maybeSingle();

    if (promoError || !promo) {
      return { valid: false, reason: "invalid", message: "Invalid or inactive promo code." };
    }

    if (new Date(promo.expiry_date) < new Date()) {
      return { valid: false, reason: "expired", message: "This promo code has expired." };
    }

    if (promo.max_uses !== null && promo.max_uses !== undefined) {
      const { count: totalUses } = await supabaseAdmin
        .from("user_subscription")
        .select("*", { count: "exact", head: true })
        .eq("promo_code_id", promo.id);
      if (totalUses != null && totalUses >= promo.max_uses) {
        return {
          valid: false,
          reason: "maxUsed",
          message: "This promo code has reached its maximum usage limit.",
        };
      }
    }

    const normalizedEmail = (email || "").toLowerCase();
    const emailDomain = normalizedEmail.split("@")[1] || "";
    const hasAllowedEmails =
      Array.isArray(promo.allowed_emails) && promo.allowed_emails.length > 0;
    const hasAllowedDomains =
      promo.is_domain_specific &&
      Array.isArray(promo.allowed_domains) &&
      promo.allowed_domains.length > 0;

    if (hasAllowedEmails || hasAllowedDomains) {
      const emailMatch =
        hasAllowedEmails &&
        promo.allowed_emails.some((e: string) => e.toLowerCase() === normalizedEmail);
      const domainMatch =
        hasAllowedDomains &&
        promo.allowed_domains.some((d: string) => d.toLowerCase() === emailDomain);
      if (!emailMatch && !domainMatch) {
        return {
          valid: false,
          reason: "invalidEmail",
          message: promo.is_domain_specific
            ? "This promo code is not valid for your email domain."
            : "This promo code is not valid for your email.",
        };
      }
    }

    return {
      valid: true,
      planName: promo.subscription?.title || "Pro Plan",
      durationMonths: promo.duration_months ?? 1,
    };
  } catch (err) {
    console.error("[validatePromoCode] error:", err);
    return {
      valid: false,
      reason: "error",
      message: "Something went wrong validating the promo code.",
    };
  }
}

export async function redeemPromoCode({
  userId,
  userEmail,
  code,
}: {
  userId: string;
  userEmail: string | null | undefined;
  code: string;
}): Promise<RedeemResult> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return { ok: false, reason: "invalid", message: "Please enter a promo code." };
  }

  try {
    // 1. Load the promo code (+ its linked subscription, if any).
    const { data: promo, error: promoError } = await supabaseAdmin
      .from("promo_code")
      .select("*, subscription:subscription_id (id, title)")
      .eq("code", normalizedCode)
      .eq("active", true)
      .maybeSingle();

    if (promoError || !promo) {
      return {
        ok: false,
        reason: "invalid",
        message: "Invalid or inactive promo code.",
      };
    }

    // 2. Expiry.
    if (new Date(promo.expiry_date) < new Date()) {
      return { ok: false, reason: "expired", message: "This promo code has expired." };
    }

    // 3. Global max_uses limit (null = unlimited).
    if (promo.max_uses !== null && promo.max_uses !== undefined) {
      const { count: totalUses } = await supabaseAdmin
        .from("user_subscription")
        .select("*", { count: "exact", head: true })
        .eq("promo_code_id", promo.id);

      if (totalUses != null && totalUses >= promo.max_uses) {
        return {
          ok: false,
          reason: "maxUsed",
          message: "This promo code has reached its maximum usage limit.",
        };
      }
    }

    // 4. Per-user limit. `uses_per_user` (default 1) is enforced here for the
    //    first time — counts ALL of this user's rows for the code (incl.
    //    deactivated), so re-redeeming the same code is always blocked even
    //    though we deactivate prior rows when stacking below.
    const usesPerUser = promo.uses_per_user ?? 1;
    const { count: userUses } = await supabaseAdmin
      .from("user_subscription")
      .select("*", { count: "exact", head: true })
      .eq("promo_code_id", promo.id)
      .eq("user_id", userId);

    if (userUses != null && userUses >= usesPerUser) {
      return {
        ok: false,
        reason: "alreadyRedeemed",
        message: "You have already redeemed this promo code.",
      };
    }

    // 5. Email / domain restrictions.
    const email = (userEmail || "").toLowerCase();
    const emailDomain = email.split("@")[1] || "";
    const hasAllowedEmails =
      Array.isArray(promo.allowed_emails) && promo.allowed_emails.length > 0;
    const hasAllowedDomains =
      promo.is_domain_specific &&
      Array.isArray(promo.allowed_domains) &&
      promo.allowed_domains.length > 0;

    if (hasAllowedEmails || hasAllowedDomains) {
      const emailMatch =
        hasAllowedEmails &&
        promo.allowed_emails.some((e: string) => e.toLowerCase() === email);
      const domainMatch =
        hasAllowedDomains &&
        promo.allowed_domains.some((d: string) => d.toLowerCase() === emailDomain);

      if (!emailMatch && !domainMatch) {
        return {
          ok: false,
          reason: "invalidEmail",
          message: promo.is_domain_specific
            ? "This promo code is not valid for your email domain."
            : "This promo code is not valid for your email.",
        };
      }
    }

    // 6. Resolve the subscription plan to attach. Reuses the signup fallback of
    //    a get-or-create "Pro" plan (signup-form-v2.tsx:1366-1398).
    let subscriptionId: string | undefined = promo.subscription_id ?? undefined;
    let planName: string = promo.subscription?.title || "Pro Plan";

    if (!subscriptionId) {
      const { data: existingPro } = await supabaseAdmin
        .from("subscription")
        .select("id, title")
        .eq("title", "Pro")
        .maybeSingle();

      if (existingPro) {
        subscriptionId = existingPro.id;
        planName = existingPro.title;
      } else {
        const { data: newSub, error: createError } = await supabaseAdmin
          .from("subscription")
          .insert({
            id: crypto.randomUUID(),
            title: "Pro",
            description: "Pro subscription via promo code",
            price: 0,
            duration: 30,
            features: ["Unlimited diagrams", "Unlimited AI", "All features"],
            active: true,
          })
          .select("id, title")
          .single();

        if (createError || !newSub) {
          return {
            ok: false,
            reason: "error",
            message: "Could not resolve a subscription plan. Please contact support.",
          };
        }
        subscriptionId = newSub.id;
        planName = newSub.title;
      }
    }

    // 7. Stack/extend: base the new expiry on the current active one if it is
    //    still in the future, otherwise on now.
    const now = new Date();
    const { data: currentActive } = await supabaseAdmin
      .from("user_subscription")
      .select("end_date")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("end_date", now.toISOString())
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const existingEnd = currentActive?.end_date ? new Date(currentActive.end_date) : null;
    const base = existingEnd && existingEnd > now ? existingEnd : now;
    const durationMonths = promo.duration_months ?? 1;
    const endDate = addMonths(base, durationMonths);

    // 8. Deactivate existing active rows, then insert the new one so a single
    //    active row carries the cumulative expiry. This keeps the
    //    most-recent-active queries in subscription-features.ts and the profile
    //    page working unchanged.
    await supabaseAdmin
      .from("user_subscription")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    const { error: insertError } = await supabaseAdmin
      .from("user_subscription")
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        subscription_id: subscriptionId,
        promo_code_id: promo.id,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
      });

    if (insertError) {
      console.error("[redeemPromoCode] insert error:", insertError);
      return {
        ok: false,
        reason: "error",
        message: "Could not apply the promo code. Please try again.",
      };
    }

    // 9. Invalidate cached feature limits so the new plan takes effect.
    clearFeatureLimitsCache(userId);

    return { ok: true, planName, endDate: endDate.toISOString() };
  } catch (err) {
    console.error("[redeemPromoCode] error:", err);
    return {
      ok: false,
      reason: "error",
      message: "Something went wrong redeeming the promo code.",
    };
  }
}
