/**
 * List of known disposable/temporary email domains
 * This list can be extended as needed
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  // Common disposable email providers
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "maildrop.cc",
  "throwaway.email",
  "temp-mail.org",
  "getnada.com",
  "yopmail.com",
  "fakeinbox.com",
  "trashmail.com",
  "sharklasers.com",
  "grr.la",
  "guerrillamail.info",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamailblock.com",
  "spam4.me",
  "tempinbox.com",
  "temp-mail.io",
  "throwawaymail.com",
  "emailondeck.com",
  "mailnesia.com",
  "mytemp.email",
  "mohmal.com",
  "tempsky.com",
  "discard.email",
  "fakemail.net",
  "mailtemp.net",
  "tempr.email",
  "tempmail.net",
  "mintemail.com",
  "trash-mail.com",
  "anonbox.net",
  "temporaryemail.net",
  "tempmailo.com",
  "fakemailgenerator.com",
  "getairmail.com",
  "mailcatch.com",
  "slippery.email",
  "tempemail.net",
  "0815.ru",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "einrot.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  // Add more as needed
];

/**
 * Check if an email address uses a disposable/temporary email provider
 * @param email - The email address to check
 * @returns true if the email is from a disposable provider, false otherwise
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  // Extract domain from email
  const emailLower = email.toLowerCase().trim();
  const domain = emailLower.split("@")[1];

  if (!domain) {
    return false;
  }

  // Check if the domain is in the disposable list
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Get the domain from an email address
 * @param email - The email address
 * @returns The domain part of the email
 */
export function getEmailDomain(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  const domain = email.toLowerCase().trim().split("@")[1];
  return domain || "";
}

/**
 * Validate email and check if it's disposable
 * @param email - The email address to validate
 * @returns Object with validation result and message
 */
export function validateEmail(email: string): {
  isValid: boolean;
  isDisposable: boolean;
  message?: string;
} {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return {
      isValid: false,
      isDisposable: false,
      message: "Please enter a valid email address",
    };
  }

  // Check if disposable
  const disposable = isDisposableEmail(email);

  if (disposable) {
    return {
      isValid: false,
      isDisposable: true,
      message: "Temporary or disposable email addresses are not allowed. Please use a permanent email address.",
    };
  }

  return {
    isValid: true,
    isDisposable: false,
  };
}
