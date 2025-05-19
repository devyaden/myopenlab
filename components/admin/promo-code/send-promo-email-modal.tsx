"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PromoCode {
  id: string;
  name: string;
  code: string;
  subscription_id: string;
  subscription?: {
    title: string;
  };
  expiry_date: string;
  max_uses?: number;
}

interface BrevoList {
  id: number;
  name: string;
  totalSubscribers?: number;
}

interface BrevoTemplate {
  id: number;
  name: string;
}

interface SendPromoEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoCode: any;
}

const formSchema = z
  .object({
    email_template_id: z.string().min(1, "Template is required"),
    email_list_ids: z.array(z.string()).default([]),
    custom_emails: z
      .array(
        z.string().refine(
          (email) => {
            // Allow empty strings (they'll be filtered out later)
            // or validate as email
            return (
              email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            );
          },
          {
            message: "Invalid email address",
          }
        )
      )
      .default([""]),
  })
  .refine(
    (data) => {
      // Check if at least one list is selected or one valid email is provided
      const hasListIds = data.email_list_ids.length > 0;
      const hasValidEmails = data.custom_emails.some(
        (email) =>
          email.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      );
      return hasListIds || hasValidEmails;
    },
    {
      message:
        "Please select at least one contact list or provide at least one valid email address",
      path: ["custom_emails"], // Show error on custom emails field
    }
  );

type FormValues = z.infer<typeof formSchema>;

export function SendPromoEmailModal({
  isOpen,
  onClose,
  promoCode,
}: SendPromoEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [brevoLists, setBrevoLists] = useState<BrevoList[]>([]);
  const [brevoTemplates, setBrevoTemplates] = useState<BrevoTemplate[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email_template_id: "",
      email_list_ids: [],
      custom_emails: [""],
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchBrevoLists();
      fetchBrevoTemplates();
    }
  }, [isOpen]);

  const fetchBrevoLists = async () => {
    setLoadingLists(true);
    try {
      const response = await fetch("/api/brevo?resource=lists");
      const data = await response.json();
      if (data.lists) {
        setBrevoLists(data.lists);
      }
    } catch (error) {
      console.error("Error fetching Brevo lists:", error);
      toast.error("Failed to fetch contact lists");
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchBrevoTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch("/api/brevo?resource=templates");
      const data = await response.json();
      if (data.templates) {
        setBrevoTemplates(data.templates);
      }
    } catch (error) {
      console.error("Error fetching Brevo templates:", error);
      toast.error("Failed to fetch email templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Double-check template is selected
      if (!values.email_template_id) {
        toast.error("Please select an email template");
        setLoading(false);
        return;
      }

      // Validate that at least one recipient is selected
      const validEmails = values.custom_emails.filter(
        (email) =>
          email.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      );
      const hasListRecipients = values.email_list_ids.length > 0;
      const hasEmailRecipients = validEmails.length > 0;

      if (!hasListRecipients && !hasEmailRecipients) {
        toast.error(
          "Please select at least one contact list or add at least one valid email address"
        );
        setLoading(false);
        return;
      }

      // Calculate remaining days for expiry
      const remainingDaysInExpiry = Math.ceil(
        (new Date(promoCode.expiry_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      // Prepare request data with correct parameter names
      const emailData = {
        promo_code: promoCode.code,
        templateId: values.email_template_id,
        remainingDaysInExpiry: Math.max(0, remainingDaysInExpiry), // Ensure non-negative
        email_list_ids: values.email_list_ids,
        emails: validEmails, // Only send valid emails
        maxUses: promoCode.max_uses || 1, // Add max uses if available
      };

      const response = await fetch("/api/send-promo-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const result = await response.json();
        toast.error(
          `Failed to send emails: ${result.error || "Unknown error"}`
        );
        return;
      }

      toast.success("Emails sent successfully!");
      onClose();
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error("Failed to send emails. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Promo Code Email</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email_template_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Template</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingTemplates ? (
                        <SelectItem value="loading" disabled>
                          Loading templates...
                        </SelectItem>
                      ) : brevoTemplates.length > 0 ? (
                        brevoTemplates.map((template) => (
                          <SelectItem
                            key={template.id}
                            value={String(template.id)}
                          >
                            {template.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No templates found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              <strong>Note:</strong> You must select either a contact list,
              provide at least one email address, or both.
            </div>

            <div className="space-y-4">
              <div>
                <FormLabel>Brevo Contact Lists</FormLabel>
                <FormDescription className="mb-2">
                  Select one or more contact lists to send the promo code to
                </FormDescription>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {form.watch("email_list_ids").length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {form.watch("email_list_ids").length <= 2 ? (
                            form.watch("email_list_ids").map((id) => {
                              const list = brevoLists.find(
                                (l) => String(l.id) === id
                              );
                              return (
                                <Badge
                                  key={id}
                                  variant="secondary"
                                  className="mr-1"
                                >
                                  {list?.name || id}
                                </Badge>
                              );
                            })
                          ) : (
                            <span>
                              {form.watch("email_list_ids").length} lists
                              selected
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Select lists
                        </span>
                      )}
                      {form.watch("email_list_ids").length > 0 ? (
                        <X
                          className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            form.setValue("email_list_ids", []);
                          }}
                        />
                      ) : (
                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search lists..." />
                      <CommandEmpty>No lists found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-60">
                          {loadingLists ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              Loading lists...
                            </div>
                          ) : brevoLists.length > 0 ? (
                            brevoLists.map((list) => (
                              <CommandItem
                                key={list.id}
                                value={String(list.id)}
                                onSelect={() => {
                                  const currentListIds =
                                    form.getValues("email_list_ids");
                                  const listId = String(list.id);
                                  const isSelected =
                                    currentListIds.includes(listId);

                                  if (isSelected) {
                                    form.setValue(
                                      "email_list_ids",
                                      currentListIds.filter(
                                        (id) => id !== listId
                                      )
                                    );
                                  } else {
                                    form.setValue("email_list_ids", [
                                      ...currentListIds,
                                      listId,
                                    ]);
                                  }
                                }}
                              >
                                <div className="flex items-center">
                                  <div
                                    className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                      form
                                        .watch("email_list_ids")
                                        .includes(String(list.id))
                                        ? "bg-primary text-primary-foreground"
                                        : "opacity-50"
                                    )}
                                  >
                                    {form
                                      .watch("email_list_ids")
                                      .includes(String(list.id)) && (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </div>
                                  <span>{list.name}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({list.totalSubscribers || 0} contacts)
                                  </span>
                                </div>
                              </CommandItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              No contact lists found
                            </div>
                          )}
                        </ScrollArea>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {!form.watch("email_list_ids").length &&
                  form.formState.errors.custom_emails && (
                    <FormMessage>
                      Please select at least one contact list or provide a valid
                      email
                    </FormMessage>
                  )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <FormLabel>Additional Email Addresses</FormLabel>
                    <FormDescription className="text-xs">
                      Add individual email addresses to send the promo code to
                    </FormDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentEmails =
                        form.getValues("custom_emails") || [];
                      form.setValue("custom_emails", [...currentEmails, ""]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.watch("custom_emails")?.map((email, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={email}
                        onChange={(e) => {
                          const newEmails = [
                            ...(form.getValues("custom_emails") || []),
                          ];
                          newEmails[index] = e.target.value;
                          form.setValue("custom_emails", newEmails);
                        }}
                        placeholder="e.g. user@example.com"
                        type="email"
                        className={cn(
                          email.trim() !== "" &&
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
                            "border-red-500"
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newEmails = [
                            ...(form.getValues("custom_emails") || []),
                          ];
                          if (newEmails.length > 1) {
                            newEmails.splice(index, 1);
                            form.setValue("custom_emails", newEmails);
                          } else {
                            // If it's the last one, just clear it
                            form.setValue("custom_emails", [""]);
                          }
                        }}
                        disabled={
                          (form.watch("custom_emails") || []).length <= 1
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {form.formState.errors.custom_emails &&
                  !form.watch("email_list_ids").length && (
                    <FormMessage>
                      {form.formState.errors.custom_emails.message}
                    </FormMessage>
                  )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !form.watch("email_template_id") ||
                  (form.watch("email_list_ids").length === 0 &&
                    !form
                      .watch("custom_emails")
                      .some(
                        (email) =>
                          email.trim() !== "" &&
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                      ))
                }
              >
                {loading ? "Sending..." : "Send Emails"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
