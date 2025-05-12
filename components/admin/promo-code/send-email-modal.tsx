"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Send, X } from "lucide-react";
import { useState } from "react";

interface PromoCode {
  id: string;
  name: string;
  code: string;
  subscription_id: string;
  subscription?: {
    title: string;
  };
}

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoCode: PromoCode;
}

export function SendEmailModal({
  isOpen,
  onClose,
  promoCode,
}: SendEmailModalProps) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [subject, setSubject] = useState(
    `Your ${promoCode.subscription?.title || "Subscription"} Promo Code`
  );

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addEmail = () => {
    setEmails([...emails, ""]);
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      const newEmails = [...emails];
      newEmails.splice(index, 1);
      setEmails(newEmails);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emails.filter((e) => e.trim() !== "");

    if (validEmails.length === 0) {
      newErrors.emails = "At least one email is required";
    } else {
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i].trim();
        if (email && !emailRegex.test(email)) {
          newErrors[`email-${i}`] = "Invalid email format";
        }
      }
    }

    if (!subject.trim()) newErrors.subject = "Subject is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const validEmails = emails.filter((e) => e.trim() !== "");

    try {
      // Make API call to your backend to send emails
      // This is a placeholder for your actual email sending API
      const response = await fetch("/api/send-promo-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Using first part of email as first name
          promo_code: promoCode.code,
          subject,
          emails,
        }),
      });

      toast({
        title: "Success",
        description: `Emails sent to ${validEmails.length} recipient${validEmails.length !== 1 ? "s" : ""}.`,
      });

      onClose();
    } catch (error) {
      console.error("Error sending emails:", error);
      toast({
        title: "Error",
        description: "Failed to send emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Promo Code Emails</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="emails">
                Email Recipients <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmail}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {errors.emails && (
              <span className="text-sm text-red-500">{errors.emails}</span>
            )}
            <div className="space-y-2">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder="e.g. user@example.com"
                    type="email"
                    className={errors[`email-${index}`] ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEmail(index)}
                    disabled={emails.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {emails.map(
                (_, index) =>
                  errors[`email-${index}`] && (
                    <span
                      key={`error-${index}`}
                      className="text-sm text-red-500"
                    >
                      {errors[`email-${index}`]}
                    </span>
                  )
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={errors.subject ? "border-red-500" : ""}
            />
            {errors.subject && (
              <span className="text-sm text-red-500">{errors.subject}</span>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Sending..." : "Send Emails"}
              {!loading && <Send className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
