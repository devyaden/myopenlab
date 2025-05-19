// This is a mock service for promo code validation
// In a real application, this would connect to your backend API

export type PromoCodeStatus = {
  isValid: boolean;
  discount?: string;
  error?: string;
  errorType?: "invalid" | "expired" | "maxUsed" | "domainRestricted";
};

// Mock promo codes for demonstration
const VALID_PROMO_CODES = [
  {
    code: "NEWBIE",
    discount: "30% off for 3 months",
    expiresAt: new Date("2025-12-31"),
    maxUses: 1000,
    currentUses: 450,
    restrictedToDomains: [], // No domain restriction
  },
  {
    code: "TECHCO",
    discount: "50% off for 6 months",
    expiresAt: new Date("2025-06-30"),
    maxUses: 200,
    currentUses: 200, // Max uses reached
    restrictedToDomains: ["techcompany.com", "tech.org"],
  },
  {
    code: "EDUCAT",
    discount: "75% off for 12 months",
    expiresAt: new Date("2025-08-15"),
    maxUses: 500,
    currentUses: 320,
    restrictedToDomains: ["edu", "ac.uk", "education.gov"], // Education domains
  },
  {
    code: "EXPIRE",
    discount: "25% off for 1 month",
    expiresAt: new Date("2024-01-01"), // Already expired
    maxUses: 100,
    currentUses: 50,
    restrictedToDomains: [],
  },
];

/**
 * Validate a promo code
 *
 * @param code The promo code to validate
 * @param email The user's email (for domain-specific codes)
 * @returns Validation result with status and any error messages
 */
export async function validatePromoCode(
  code: string,
  email: string
): Promise<PromoCodeStatus> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Find the promo code in our mock database
  const promoCode = VALID_PROMO_CODES.find(
    (promo) => promo.code.toUpperCase() === code.toUpperCase()
  );

  // Check if code exists
  if (!promoCode) {
    return {
      isValid: false,
      error: "Invalid promo code",
      errorType: "invalid",
    };
  }

  // Check if code has expired
  if (promoCode.expiresAt < new Date()) {
    return {
      isValid: false,
      error: "This promo code has expired",
      errorType: "expired",
    };
  }

  // Check if code has reached max uses
  if (promoCode.currentUses >= promoCode.maxUses) {
    return {
      isValid: false,
      error: "This promo code has reached its usage limit",
      errorType: "maxUsed",
    };
  }

  // Check domain restrictions if any exist
  if (promoCode.restrictedToDomains.length > 0) {
    const userDomain = email.split("@")[1];
    const isAllowed = promoCode.restrictedToDomains.some(
      (domain) => userDomain === domain || userDomain.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return {
        isValid: false,
        error: "This promo code is not valid for your email domain",
        errorType: "domainRestricted",
      };
    }
  }

  // If all checks pass, the code is valid
  return {
    isValid: true,
    discount: promoCode.discount,
  };
}
