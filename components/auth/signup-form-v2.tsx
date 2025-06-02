"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/lib/contexts/userContext";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  EyeIcon,
  EyeOffIcon,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
// Import tracking utilities
import { errorTracker } from "@/lib/posthog/errors";
import { AuthEvent, FormEvent, InteractionEvent } from "@/lib/posthog/events";
import { tracker } from "@/lib/posthog/tracker";

// Define error types
type ErrorType =
  | "invalid"
  | "expired"
  | "maxUsed"
  | "domainRestricted"
  | "invalidDomain"
  | "invalidEmail"
  | "error"
  | null;

// Define errors state type
type FormErrors = Partial<{
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  companyName: string;
  industry: string;
  customIndustry: string;
  position: string;
  customPosition: string;
  companySize: string;
  customCompanySize: string;
  promoCode: string;
  agreeToTerms: string;
  submit: string;
}>;

// Form data type
type FormData = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  companyName: string;
  industry: string;
  customIndustry: string;
  position: string;
  customPosition: string;
  companySize: string;
  customCompanySize: string;
  paymentMethod: string;
  promoCode: string;
  agreeToTerms: boolean;
  googleAuth?: boolean;
};

// Initial form data
const initialFormData: FormData = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  companyName: "",
  industry: "",
  customIndustry: "",
  position: "",
  customPosition: "",
  companySize: "",
  customCompanySize: "",
  paymentMethod: "promo",
  promoCode: "",
  agreeToTerms: false,
  googleAuth: false,
};

// Industry options
const industryOptions = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Marketing",
  "Other",
];

// Position options
const positionOptions = [
  "CEO/Founder",
  "Manager",
  "Director",
  "Developer",
  "Designer",
  "Marketing Specialist",
  "Sales Representative",
  "Other",
];

// Company size options
const companySizeOptions = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
  "Other",
];

interface SignupFormProps {
  googleData?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Update the PromoCodeStatus type
type EnhancedPromoCodeStatus = {
  isValid: boolean;
  error?: string | null;
  errorType?: ErrorType;
  discount?: string;
  subscription?: any;
  promoCodeData?: any;
};

// Step 1: Account Information
function AccountStep({
  formData,
  errors,
  handleChange,
  handleGoogleSignIn,
  showPassword,
  setShowPassword,
}: {
  formData: FormData;
  errors: FormErrors;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGoogleSignIn: () => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  // Track field interactions
  const handleFieldFocus = (fieldName: string) => {
    tracker.trackForm(FormEvent.FIELD_FOCUSED, {
      form_name: "signup_form",
      field_name: fieldName,
      form_step: 1,
    });
  };

  const handleFieldBlur = (fieldName: string) => {
    tracker.trackForm(FormEvent.FIELD_BLURRED, {
      form_name: "signup_form",
      field_name: fieldName,
      form_step: 1,
    });
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
    tracker.trackInteraction(InteractionEvent.BUTTON_CLICK, {
      element_type: "button",
      element_text: "toggle_password_visibility",
      interaction_context: "signup_form_step_1",
    });
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            onFocus={() => handleFieldFocus("firstName")}
            onBlur={() => handleFieldBlur("firstName")}
            className={cn(
              "bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green",
              errors.firstName && "border-red-500"
            )}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
          )}
        </div>
        <div>
          <Input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            onFocus={() => handleFieldFocus("lastName")}
            onBlur={() => handleFieldBlur("lastName")}
            className={cn(
              "bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green",
              errors.lastName && "border-red-500"
            )}
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          onFocus={() => handleFieldFocus("email")}
          onBlur={() => handleFieldBlur("email")}
          className={cn(
            "bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green",
            errors.email && "border-red-500"
          )}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          onFocus={() => handleFieldFocus("password")}
          onBlur={() => handleFieldBlur("password")}
          className={cn(
            "bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green pr-10",
            errors.password && "border-red-500"
          )}
        />
        <button
          type="button"
          onClick={handlePasswordToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-yadn-primary-gray/60 hover:text-yadn-primary-gray"
        >
          {showPassword ? (
            <EyeOffIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password}</p>
        )}
      </div>
    </>
  );
}

// Step 2: Company Information
function CompanyStep({
  formData,
  errors,
  handleChange,
  handleSelectChange,
}: {
  formData: FormData;
  errors: FormErrors;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string | boolean) => void;
}) {
  const handleFieldFocus = (fieldName: string) => {
    tracker.trackForm(FormEvent.FIELD_FOCUSED, {
      form_name: "signup_form",
      field_name: fieldName,
      form_step: 2,
    });
  };

  const handleFieldBlur = (fieldName: string) => {
    tracker.trackForm(FormEvent.FIELD_BLURRED, {
      form_name: "signup_form",
      field_name: fieldName,
      form_step: 2,
    });
  };

  const handleSelectOpen = (fieldName: string) => {
    tracker.trackInteraction(InteractionEvent.DROPDOWN_OPENED, {
      element_type: "select",
      element_text: fieldName,
      interaction_context: "signup_form_step_2",
    });
  };

  return (
    <>
      {formData.googleAuth && (
        <div className="mb-6 p-4 bg-yadn-accent-green/10 border border-yadn-accent-green/30 rounded-lg">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-yadn-accent-green mr-2" />
            <p className="text-yadn-primary-gray">
              <span className="font-medium">Signed in with Google:</span>{" "}
              {formData.email}
            </p>
          </div>
        </div>
      )}

      <div>
        <Input
          type="text"
          name="companyName"
          placeholder="Company Name"
          value={formData.companyName}
          onChange={handleChange}
          onFocus={() => handleFieldFocus("companyName")}
          onBlur={() => handleFieldBlur("companyName")}
          className={cn(
            "bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green",
            errors.companyName && "border-red-500"
          )}
        />
        {errors.companyName && (
          <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry" className="text-yadn-primary-gray/80">
          Industry
        </Label>
        <Select
          value={formData.industry}
          onValueChange={(value) => {
            handleSelectChange("industry", value);
            tracker.trackForm(FormEvent.FIELD_FOCUSED, {
              form_name: "signup_form",
              field_name: "industry",
              form_step: 2,
            });
          }}
          onOpenChange={(open) => {
            if (open) handleSelectOpen("industry");
          }}
        >
          <SelectTrigger
            id="industry"
            className={cn(
              "bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray focus:border-yadn-accent-green focus:ring-yadn-accent-green",
              errors.industry && "border-red-500"
            )}
          >
            <SelectValue placeholder="Select Industry" />
          </SelectTrigger>
          <SelectContent className="bg-[#000A1F] border-yadn-primary-gray/10">
            {industryOptions.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="text-yadn-primary-gray focus:bg-yadn-accent-green/20 focus:text-yadn-primary-gray"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.industry && (
          <p className="mt-1 text-xs text-red-500">{errors.industry}</p>
        )}
      </div>

      {formData.industry === "Other" && (
        <div>
          <Input
            type="text"
            name="customIndustry"
            placeholder="Specify Industry"
            value={formData.customIndustry}
            onChange={handleChange}
            onFocus={() => handleFieldFocus("customIndustry")}
            onBlur={() => handleFieldBlur("customIndustry")}
            className={cn(
              "bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green",
              errors.customIndustry && "border-red-500"
            )}
          />
          {errors.customIndustry && (
            <p className="mt-1 text-xs text-red-500">{errors.customIndustry}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="position" className="text-yadn-primary-gray/80">
          Position
        </Label>
        <Select
          value={formData.position}
          onValueChange={(value) => {
            handleSelectChange("position", value);
            tracker.trackForm(FormEvent.FIELD_FOCUSED, {
              form_name: "signup_form",
              field_name: "position",
              form_step: 2,
            });
          }}
          onOpenChange={(open) => {
            if (open) handleSelectOpen("position");
          }}
        >
          <SelectTrigger
            id="position"
            className={cn(
              "bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray focus:border-yadn-accent-green focus:ring-yadn-accent-green",
              errors.position && "border-red-500"
            )}
          >
            <SelectValue placeholder="Select Position" />
          </SelectTrigger>
          <SelectContent className="bg-[#000A1F] border-yadn-primary-gray/10">
            {positionOptions.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="text-yadn-primary-gray focus:bg-yadn-accent-green/20 focus:text-yadn-primary-gray"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.position && (
          <p className="mt-1 text-xs text-red-500">{errors.position}</p>
        )}
      </div>

      {formData.position === "Other" && (
        <div>
          <Input
            type="text"
            name="customPosition"
            placeholder="Specify Position"
            value={formData.customPosition}
            onChange={handleChange}
            onFocus={() => handleFieldFocus("customPosition")}
            onBlur={() => handleFieldBlur("customPosition")}
            className={cn(
              "bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green",
              errors.customPosition && "border-red-500"
            )}
          />
          {errors.customPosition && (
            <p className="mt-1 text-xs text-red-500">{errors.customPosition}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="companySize" className="text-yadn-primary-gray/80">
          Company Size
        </Label>
        <Select
          value={formData.companySize}
          onValueChange={(value) => {
            handleSelectChange("companySize", value);
            tracker.trackForm(FormEvent.FIELD_FOCUSED, {
              form_name: "signup_form",
              field_name: "companySize",
              form_step: 2,
            });
          }}
          onOpenChange={(open) => {
            if (open) handleSelectOpen("companySize");
          }}
        >
          <SelectTrigger
            id="companySize"
            className={cn(
              "bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray focus:border-yadn-accent-green focus:ring-yadn-accent-green",
              errors.companySize && "border-red-500"
            )}
          >
            <SelectValue placeholder="Select Company Size" />
          </SelectTrigger>
          <SelectContent className="bg-[#000A1F] border-yadn-primary-gray/10">
            {companySizeOptions.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="text-yadn-primary-gray focus:bg-yadn-accent-green/20 focus:text-yadn-primary-gray"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.companySize && (
          <p className="mt-1 text-xs text-red-500">{errors.companySize}</p>
        )}
      </div>

      {formData.companySize === "Other" && (
        <div>
          <Input
            type="text"
            name="customCompanySize"
            placeholder="Specify Company Size"
            value={formData.customCompanySize}
            onChange={handleChange}
            onFocus={() => handleFieldFocus("customCompanySize")}
            onBlur={() => handleFieldBlur("customCompanySize")}
            className={cn(
              "bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green",
              errors.customCompanySize && "border-red-500"
            )}
          />
          {errors.customCompanySize && (
            <p className="mt-1 text-xs text-red-500">
              {errors.customCompanySize}
            </p>
          )}
        </div>
      )}
    </>
  );
}

// Step 3: Payment Information
function PaymentStep({
  formData,
  errors,
  handleSelectChange,
  promoStatus,
  promoInputRef,
  handleChange,
  formSubmitted,
  setFormData,
  setErrors,
}: {
  formData: FormData;
  errors: FormErrors;
  handleSelectChange: (name: string, value: string | boolean) => void;
  promoStatus: EnhancedPromoCodeStatus | null;
  promoInputRef: React.RefObject<HTMLInputElement>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formSubmitted: boolean;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
}) {
  const getPromoErrorMessage = () => {
    if (!promoStatus || promoStatus.isValid || !promoStatus.error) return null;

    const icon = <AlertCircle className="h-4 w-4 mr-1" />;

    return (
      <div className="flex items-center text-xs font-medium mt-2">
        {icon}
        <span>{promoStatus.error}</span>
      </div>
    );
  };

  const handlePaymentMethodChange = (value: string) => {
    handleSelectChange("paymentMethod", value);
    tracker.trackForm(FormEvent.PAYMENT_METHOD_SELECTED, {
      form_name: "signup_form",
      form_step: 3,
      payment_method: value,
    });
  };

  const handleTermsChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreeToTerms: checked,
    }));

    tracker.trackInteraction(InteractionEvent.BUTTON_CLICK, {
      element_type: "checkbox",
      element_text: "agree_to_terms",
      interaction_context: "signup_form_step_3",
    });

    if (checked && errors.agreeToTerms) {
      setErrors((prev: FormErrors) => ({
        ...prev,
        agreeToTerms: undefined,
      }));
    }
  };

  return (
    <>
      <div className="space-y-4">
        <Label className="text-yadn-primary-gray/80">Choose an option</Label>

        <RadioGroup
          value={formData.paymentMethod}
          onValueChange={handlePaymentMethodChange}
          className="space-y-3"
        >
          <div
            className={cn(
              "flex items-center space-x-3 rounded-lg border p-4",
              formData.paymentMethod === "card"
                ? "border-yadn-accent-green bg-yadn-accent-green/10"
                : "border-yadn-primary-gray/10 bg-yadn-primary-gray/5"
            )}
          >
            <RadioGroupItem
              value="card"
              id="card"
              className="border-yadn-primary-gray/30 text-yadn-accent-green"
            />
            <Label
              htmlFor="card"
              className="flex flex-1 items-center gap-2 cursor-pointer"
            >
              <CreditCard className="h-5 w-5 text-yadn-accent-green" />
              <div>
                <div className="text-yadn-primary-gray">Add Payment Method</div>
                <div className="text-xs text-yadn-primary-gray/60">
                  Add credit card or other payment method
                </div>
              </div>
            </Label>
          </div>

          <div
            className={cn(
              "flex items-center space-x-3 rounded-lg border p-4",
              formData.paymentMethod === "promo"
                ? "border-yadn-accent-green bg-yadn-accent-green/10"
                : "border-yadn-primary-gray/10 bg-yadn-primary-gray/5"
            )}
          >
            <RadioGroupItem
              value="promo"
              id="promo"
              className="border-yadn-primary-gray/30 text-yadn-accent-green"
            />
            <Label
              htmlFor="promo"
              className="flex flex-1 items-center gap-2 cursor-pointer"
            >
              <Tag className="h-5 w-5 text-yadn-accent-green" />
              <div>
                <div className="text-yadn-primary-gray">Use Promo Code</div>
                <div className="text-xs text-yadn-primary-gray/60">
                  Enter a promo code
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {formData.paymentMethod === "card" && (
          <div className="rounded-lg border border-yadn-primary-gray/10 bg-yadn-primary-gray/5 p-4">
            <p className="text-yadn-primary-gray/80 mb-4">
              Payment details will be collected securely
            </p>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Card Number"
                className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green"
                onFocus={() => {
                  tracker.trackForm(FormEvent.FIELD_FOCUSED, {
                    form_name: "signup_form",
                    field_name: "card_number",
                    form_step: 3,
                  });
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="MM/YY"
                  className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green"
                  onFocus={() => {
                    tracker.trackForm(FormEvent.FIELD_FOCUSED, {
                      form_name: "signup_form",
                      field_name: "card_expiry",
                      form_step: 3,
                    });
                  }}
                />
                <Input
                  type="text"
                  placeholder="CVC"
                  className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green"
                  onFocus={() => {
                    tracker.trackForm(FormEvent.FIELD_FOCUSED, {
                      form_name: "signup_form",
                      field_name: "card_cvc",
                      form_step: 3,
                    });
                  }}
                />
              </div>

              <p className="text-xs text-yadn-primary-gray/60">
                Your payment information is processed securely. We do not store
                your credit card details.
              </p>
            </div>
          </div>
        )}

        {formData.paymentMethod === "promo" && (
          <div>
            <div className="mt-4 flex justify-center">
              <div className="inline-block">
                <table
                  className={cn(
                    "bg-yadn-accent-green rounded-lg shadow-md",
                    promoStatus?.isValid && "bg-yadn-accent-green",
                    promoStatus?.isValid === false && "bg-yadn-accent-green/80"
                  )}
                  cellPadding="0"
                  cellSpacing="0"
                  style={{ margin: "0 auto" }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        <div
                          style={{
                            border: "2px solid #000A1F",
                            padding: "15px 20px",
                            backgroundColor: "transparent",
                            position: "relative",
                          }}
                          className="flex items-center justify-between"
                        >
                          <div className="sr-only">
                            <Input
                              ref={promoInputRef}
                              type="text"
                              name="promoCode"
                              value={formData.promoCode}
                              onChange={handleChange}
                              maxLength={8}
                              className="sr-only"
                              aria-label="Promo code"
                              onFocus={() => {
                                tracker.trackForm(FormEvent.FIELD_FOCUSED, {
                                  form_name: "signup_form",
                                  field_name: "promo_code",
                                  form_step: 3,
                                });
                              }}
                            />
                          </div>
                          <div
                            className="flex space-x-3 cursor-text flex-1 justify-center"
                            onClick={() => promoInputRef.current?.focus()}
                          >
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                              <div
                                key={index}
                                className="flex flex-col items-center w-8"
                              >
                                <div className="text-[#000A1F] text-2xl font-bold h-8 flex items-center justify-center">
                                  {formData.promoCode[index] || ""}
                                </div>
                                <div className="h-0.5 w-full bg-[#000A1F]"></div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {promoStatus && (
                          <div
                            className={cn(
                              "mt-2 text-xs font-medium",
                              promoStatus.isValid
                                ? "text-[#000A1F]"
                                : "text-red-700"
                            )}
                          >
                            {promoStatus.isValid ? (
                              <div className="flex items-center">
                                <Check className="h-4 w-4 mr-1" />
                                <span>Valid: {promoStatus.discount}</span>
                              </div>
                            ) : (
                              getPromoErrorMessage()
                            )}
                          </div>
                        )}

                        {formSubmitted && errors.promoCode && !promoStatus && (
                          <p className="mt-2 text-xs text-red-700 font-medium">
                            {errors.promoCode}
                          </p>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-center text-xs text-yadn-primary-gray/60 mt-4">
              Enter your promo code
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 mt-6">
        <Checkbox
          id="terms"
          name="agreeToTerms"
          checked={formData.agreeToTerms}
          onCheckedChange={handleTermsChange}
          className={cn(
            "border-yadn-primary-gray/30 data-[state=checked]:bg-yadn-accent-green data-[state=checked]:border-yadn-accent-green",
            formSubmitted && errors.agreeToTerms && "border-red-500"
          )}
        />
        <label htmlFor="terms" className="text-sm text-yadn-primary-gray/80">
          I agree to the{" "}
          <Link
            href="/terms"
            className="text-yadn-accent-green hover:underline"
            onClick={() => {
              tracker.trackInteraction(InteractionEvent.LINK_CLICK, {
                element_type: "link",
                element_text: "Terms of Service",
                interaction_context: "signup_form_step_3",
              });
            }}
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-yadn-accent-green hover:underline"
            onClick={() => {
              tracker.trackInteraction(InteractionEvent.LINK_CLICK, {
                element_type: "link",
                element_text: "Privacy Policy",
                interaction_context: "signup_form_step_3",
              });
            }}
          >
            Privacy Policy
          </Link>
        </label>
      </div>
      {formSubmitted && errors.agreeToTerms && (
        <p className="mt-1 text-xs text-red-500">{errors.agreeToTerms}</p>
      )}

      {errors.submit && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {errors.submit}
        </div>
      )}
    </>
  );
}

// Main SignupForm Component
export default function SignupForm({ googleData }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromGoogle = searchParams.get("fromGoogle") === "true" || !!googleData;

  const [currentStep, setCurrentStep] = useState(fromGoogle ? 2 : 1);
  const [formData, setFormData] = useState<FormData>(() => {
    if (googleData) {
      return {
        ...initialFormData,
        email: googleData.email,
        firstName: googleData.firstName,
        lastName: googleData.lastName,
        googleAuth: true,
      };
    }
    return initialFormData;
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formStartTime, setFormStartTime] = useState<number>(Date.now());
  const promoInputRef = useRef<HTMLInputElement>(null);

  // Promo code validation states
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoStatus, setPromoStatus] =
    useState<EnhancedPromoCodeStatus | null>(null);
  const [promoValidationTimeout, setPromoValidationTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const { signUp, checkIfEmailExists } = useUser();

  // Track form initialization
  useEffect(() => {
    tracker.trackForm(FormEvent.FORM_STARTED, {
      form_name: "signup_form",
      form_step: currentStep,
      total_steps: 3,
    });

    if (fromGoogle) {
      tracker.trackAuth(AuthEvent.SIGNUP_STARTED, {
        auth_method: "google",
        step: 2,
        total_steps: 3,
        email_domain: googleData?.email?.split("@")[1],
      });
    } else {
      tracker.trackAuth(AuthEvent.SIGNUP_STARTED, {
        auth_method: "email",
        step: 1,
        total_steps: 3,
      });
    }

    setFormStartTime(Date.now());
  }, []);

  // Track validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const validationErrors = Object.entries(errors).map(([field, error]) =>
        typeof error === "object" && error !== null && "message" in error
          ? `${field}: ${(error as { message: string }).message}`
          : `${field}: ${error}`
      );

      tracker.trackForm(FormEvent.FORM_VALIDATION_ERROR, {
        form_name: "signup_form",
        validation_errors: validationErrors,
        form_step: currentStep,
      });

      // Track individual field errors
      Object.entries(errors).forEach(([fieldName, error]) => {
        if (error) {
          errorTracker.trackValidationError(
            "signup_form",
            fieldName,
            typeof error === "string"
              ? error
              : typeof error === "object" &&
                  error !== null &&
                  "message" in error
                ? (error as { message: string }).message
                : "Validation error"
          );
        }
      });
    }
  }, [errors, currentStep]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === "promoCode") {
      const formattedValue = value.toUpperCase().slice(0, 8);
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));

      // Track promo code entry
      if (formattedValue.length > 0) {
        tracker.trackForm(FormEvent.PROMO_CODE_ENTERED, {
          form_name: "signup_form",
          form_step: 3,
          promo_code: formattedValue,
        });
      }

      setPromoStatus(null);

      if (promoValidationTimeout) {
        clearTimeout(promoValidationTimeout);
      }

      if (formattedValue.length === 8) {
        const timeout = setTimeout(() => {
          validatePromoCodeInput(formattedValue);
        }, 500);
        setPromoValidationTimeout(timeout);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // Validate promo code
  const validatePromoCodeInput = async (code: string) => {
    if (code.length !== 8) return;

    setIsValidatingPromo(true);
    try {
      const userEmail = formData.email;
      if (!userEmail) {
        setPromoStatus({
          isValid: false,
          error: "Please enter your email first",
          errorType: "invalid",
        });
        return;
      }

      const { data, error } = await supabase
        .from("promo_code")
        .select("*, subscription:subscription_id(*)")
        .eq("code", code)
        .eq("active", true)
        .single();

      if (error || !data) {
        setPromoStatus({
          isValid: false,
          error: "Invalid or expired promo code",
          errorType: "invalid",
        });

        tracker.trackForm(FormEvent.PROMO_CODE_VALIDATED, {
          form_name: "signup_form",
          form_step: 3,
          promo_code: code,
          error_message: "Invalid or expired promo code",
        });
        return;
      }

      // Check if promo code has expired
      if (new Date(data.expiry_date) < new Date()) {
        setPromoStatus({
          isValid: false,
          error: "This promo code has expired",
          errorType: "expired",
        });

        tracker.trackForm(FormEvent.PROMO_CODE_VALIDATED, {
          form_name: "signup_form",
          form_step: 3,
          promo_code: code,
          error_message: "Promo code expired",
        });
        return;
      }

      // Check if promo code has reached its max usage limit
      if (data.max_uses !== null) {
        const { count: totalUsageCount } = await supabase
          .from("user_subscription")
          .select("*", { count: "exact" })
          .eq("promo_code_id", data.id);

        if (totalUsageCount && totalUsageCount >= data.max_uses) {
          setPromoStatus({
            isValid: false,
            error: "This promo code has reached its maximum usage limit",
            errorType: "maxUsed",
          });

          tracker.trackForm(FormEvent.PROMO_CODE_VALIDATED, {
            form_name: "signup_form",
            form_step: 3,
            promo_code: code,
            error_message: "Max usage reached",
          });
          return;
        }
      }

      // Check email/domain restrictions
      const emailDomain = userEmail.split("@")[1];
      let isEmailValid = false;

      if (data.allowed_emails && data.allowed_emails.length > 0) {
        isEmailValid = data.allowed_emails.includes(userEmail);
      }

      if (
        data.is_domain_specific &&
        data.allowed_domains &&
        data.allowed_domains.length > 0
      ) {
        isEmailValid = data.allowed_domains.includes(emailDomain);
      }

      if (
        (!data.allowed_emails || data.allowed_emails.length === 0) &&
        (!data.is_domain_specific ||
          !data.allowed_domains ||
          data.allowed_domains.length === 0)
      ) {
        isEmailValid = true;
      }

      if (!isEmailValid) {
        const errorMessage = data.is_domain_specific
          ? "This promo code is not valid for your email domain"
          : "This promo code is not valid for your email";

        setPromoStatus({
          isValid: false,
          error: errorMessage,
          errorType: data.is_domain_specific ? "invalidDomain" : "invalidEmail",
        });

        tracker.trackForm(FormEvent.PROMO_CODE_VALIDATED, {
          form_name: "signup_form",
          form_step: 3,
          promo_code: code,
          error_message: errorMessage,
        });
        return;
      }

      setPromoStatus({
        isValid: true,
        discount: `${data.subscription.title} subscription`,
        subscription: data.subscription,
        promoCodeData: data,
        errorType: null,
        error: null,
      });

      tracker.trackForm(FormEvent.PROMO_CODE_VALIDATED, {
        form_name: "signup_form",
        form_step: 3,
        promo_code: code,
        discount: data.subscription.title,
      });
    } catch (error: any) {
      console.error("Error validating promo code:", error);
      setPromoStatus({
        isValid: false,
        error: "Error validating promo code",
        errorType: "error",
      });

      errorTracker.trackAPIError(
        "/promo_code",
        error.message || "Error validating promo code",
        500
      );
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate step 1
  const validateStep1 = () => {
    const newErrors: FormErrors = {};

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";

    if (!formData.googleAuth) {
      if (!formData.password) newErrors.password = "Password is required";
      else if (formData.password.length < 8)
        newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate step 2
  const validateStep2 = () => {
    const newErrors: FormErrors = {};

    if (!formData.companyName)
      newErrors.companyName = "Company name is required";

    if (!formData.industry) newErrors.industry = "Industry is required";
    else if (formData.industry === "Other" && !formData.customIndustry)
      newErrors.customIndustry = "Please specify your industry";

    if (!formData.position) newErrors.position = "Position is required";
    else if (formData.position === "Other" && !formData.customPosition)
      newErrors.customPosition = "Please specify your position";

    if (!formData.companySize)
      newErrors.companySize = "Company size is required";
    else if (formData.companySize === "Other" && !formData.customCompanySize)
      newErrors.customCompanySize = "Please specify your company size";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate step 3
  const validateStep3 = () => {
    const newErrors: FormErrors = {};

    if (formData.paymentMethod === "promo") {
      if (!formData.promoCode) {
        newErrors.promoCode = "Promo code is required";
      } else if (formData.promoCode.length < 8) {
        newErrors.promoCode = "Promo code must be 8 characters";
      } else if (promoStatus && !promoStatus.isValid) {
        newErrors.promoCode = promoStatus.error || "Invalid promo code";
      }
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNextStep = () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Track step completion
      tracker.trackAuth(AuthEvent.SIGNUP_STEP_COMPLETED, {
        auth_method: formData.googleAuth ? "google" : "email",
        step: currentStep,
        total_steps: 3,
      });

      tracker.trackForm(FormEvent.STEP_NAVIGATION, {
        form_name: "signup_form",
        form_step: nextStep,
        navigation_direction: "forward",
      });
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    // Track back button click
    tracker.trackInteraction(InteractionEvent.BUTTON_CLICK, {
      element_type: "button",
      element_text: "Back",
      interaction_context: `signup_form_step_${currentStep}`,
    });

    if (currentStep === 2 && formData.googleAuth) {
      router.push("/");
    } else {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      tracker.trackForm(FormEvent.STEP_NAVIGATION, {
        form_name: "signup_form",
        form_step: prevStep,
        navigation_direction: "backward",
      });
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = () => {
    tracker.trackInteraction(InteractionEvent.BUTTON_CLICK, {
      element_type: "button",
      element_text: "Continue with Google",
      interaction_context: "signup_form_step_1",
    });

    // Simulate Google auth data
    const mockGoogleData = {
      email: "user@gmail.com",
      firstName: "John",
      lastName: "Doe",
    };

    setFormData({
      ...initialFormData,
      email: mockGoogleData.email,
      firstName: mockGoogleData.firstName,
      lastName: mockGoogleData.lastName,
      googleAuth: true,
    });

    setCurrentStep(2);
  };

  // Email validation
  const validateEmail = async (email: string) => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors((prev: FormErrors) => ({ ...prev, email: "Email is invalid" }));
      return false;
    }

    const emailExists = await checkIfEmailExists(email);
    if (emailExists) {
      setErrors((prev: FormErrors) => ({
        ...prev,
        email: "Email already exists. Please login instead.",
      }));
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    // Track form submission attempt
    tracker.trackForm(FormEvent.FORM_SUBMITTED, {
      form_name: "signup_form",
      form_duration: Date.now() - formStartTime,
      form_step: 3,
      payment_method: formData.paymentMethod,
      promo_code: formData.promoCode,
    });

    if ((await validateEmail(formData.email)) && validateStep3()) {
      const signupData = {
        personalInfo: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          promoCode: formData.promoCode,
          username: `${formData.firstName.toLowerCase()}_${formData.lastName.toLowerCase()}`,
        },
        companyInfo: {
          companyName: formData.companyName,
          companyEmail: formData.email,
          companySector:
            formData.industry === "Other"
              ? formData.customIndustry
              : formData.industry,
          userPosition:
            formData.position === "Other"
              ? formData.customPosition
              : formData.position,
          companySize:
            formData.companySize === "Other"
              ? formData.customCompanySize
              : formData.companySize,
        },
      };

      try {
        const { error, user } = await signUp(signupData, formData.password);

        // If signup successful and we have a valid promo code with subscription data, create subscription
        if (
          user &&
          promoStatus?.isValid &&
          promoStatus.promoCodeData &&
          promoStatus.subscription
        ) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(
            endDate.getDate() + promoStatus.subscription.duration
          );

          const { error: subscriptionError } = await supabase
            .from("user_subscription")
            .insert({
              id: uuidv4(),
              user_id: user.id,
              subscription_id: promoStatus.promoCodeData.subscription_id,
              promo_code_id: promoStatus.promoCodeData.id,
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              is_active: true,
            });

          if (subscriptionError) {
            console.error("Error creating subscription:", subscriptionError);
            errorTracker.trackAPIError(
              "/user_subscription",
              subscriptionError.message,
              500,
              { userId: user.id }
            );
            toast.error("Error creating subscription. Please contact support.");
          } else {
            console.log("Subscription created successfully!");
          }
        }

        if (error) {
          setErrors((prev: FormErrors) => ({ ...prev, submit: error }));
        } else {
          console.log("Form submitted with data:", formData);
          toast.success("Signup successful! Please confirm your email.");
          window.location.href = "/auth/login";
        }
      } catch (error: any) {
        setErrors((prev: FormErrors) => ({
          ...prev,
          submit: "An error occurred. Please try again.",
        }));
      }
    }
  };

  // Focus promo input when payment method changes to promo
  useEffect(() => {
    if (formData.paymentMethod === "promo" && promoInputRef.current) {
      setTimeout(() => {
        promoInputRef.current?.focus();
      }, 100);
    }
  }, [formData.paymentMethod]);

  // Validate promo code when email changes and we have a promo code
  useEffect(() => {
    if (
      currentStep === 3 &&
      formData.paymentMethod === "promo" &&
      formData.promoCode.length === 8
    ) {
      validatePromoCodeInput(formData.promoCode);
    }
  }, [formData.email, currentStep]);

  return (
    <div className="w-full">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep === step
                    ? "bg-yadn-accent-green text-[#000A1F]"
                    : currentStep > step
                      ? "bg-yadn-accent-green text-[#000A1F]"
                      : "bg-yadn-primary-gray/10 text-yadn-primary-gray/60",
                  formData.googleAuth && step === 1
                    ? "bg-yadn-accent-green text-[#000A1F]"
                    : ""
                )}
              >
                {currentStep > step || (formData.googleAuth && step === 1) ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step
                )}
              </div>
              <span className="mt-2 text-xs text-yadn-primary-gray/60">
                {step === 1 ? "Account" : step === 2 ? "Company" : "Payment"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div
            className={`h-1 ${currentStep > 1 || formData.googleAuth ? "bg-yadn-accent-green" : "bg-yadn-primary-gray/10"}`}
          ></div>
          <div
            className={`h-1 ${currentStep > 2 ? "bg-yadn-accent-green" : "bg-yadn-primary-gray/10"}`}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {currentStep === 1 && (
          <AccountStep
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            handleGoogleSignIn={handleGoogleSignIn}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        )}

        {currentStep === 2 && (
          <CompanyStep
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
          />
        )}

        {currentStep === 3 && (
          <PaymentStep
            formData={formData}
            errors={errors}
            handleSelectChange={handleSelectChange}
            promoStatus={promoStatus}
            promoInputRef={promoInputRef}
            handleChange={handleChange}
            formSubmitted={formSubmitted}
            setFormData={setFormData}
            setErrors={setErrors}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <Button
              type="button"
              onClick={handlePrevStep}
              variant="outline"
              className="border-yadn-primary-gray/10 text-yadn-primary-gray hover:bg-yadn-primary-gray/5 hover:text-yadn-primary-gray bg-transparent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center text-yadn-primary-gray/60 hover:text-yadn-primary-gray text-sm"
              onClick={() => {
                tracker.trackInteraction(InteractionEvent.LINK_CLICK, {
                  element_type: "link",
                  element_text: "Back to Sign In",
                  interaction_context: "signup_form_step_1",
                });
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
            </Link>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-[#000A1F] font-medium"
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-[#000A1F] font-medium"
              disabled={
                !formData.agreeToTerms ||
                (formData.paymentMethod === "promo" &&
                  formData.promoCode.length === 8 &&
                  promoStatus?.isValid === false)
              }
              onClick={() => {
                tracker.trackInteraction(InteractionEvent.BUTTON_CLICK, {
                  element_type: "button",
                  element_text: "Sign Up",
                  interaction_context: "signup_form_step_3",
                });
              }}
            >
              Sign Up
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
