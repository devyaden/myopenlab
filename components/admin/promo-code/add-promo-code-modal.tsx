"use client";

import { DatePicker } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabase/client";
import { ArrowRight, ArrowLeft, Plus, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Subscription {
  id: string;
  title: string;
}

interface BrevoList {
  id: number;
  name: string;
  totalSubscribers?: number;
}

interface BrevoTemplate {
  id: number;
  name: string;
  subject?: string;
}

interface AddPromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromoCodeAdded: () => void;
}

// Form schema for validation
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  subscription_id: z.string().min(1, "Subscription is required"),
  expiry_date: z.date({
    required_error: "Expiry date is required",
  }),
  max_uses: z.string().optional(),
  uses_per_user: z.string().min(1, "Uses per user is required"),
  active: z.boolean().default(true),
  // Access control settings
  access_type: z.enum(["all", "domain", "email", "list"]).default("all"),
  allowed_domains: z.array(z.string()).optional(),
  allowed_emails: z.array(z.string()).optional(),
  // Email settings
  send_email: z.boolean().default(false),
  email_subject: z.string().optional(),
  email_template_id: z.string().optional(),
  email_list_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddPromoCodeModal({
  isOpen,
  onClose,
  onPromoCodeAdded,
}: AddPromoCodeModalProps) {
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [brevoLists, setBrevoLists] = useState<BrevoList[]>([]);
  const [brevoTemplates, setBrevoTemplates] = useState<BrevoTemplate[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      subscription_id: "",
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      max_uses: "",
      uses_per_user: "1",
      active: true,
      access_type: "all",
      allowed_domains: [""],
      allowed_emails: [""],
      send_email: false,
      email_subject: "",
      email_template_id: "",
      email_list_id: "",
    },
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchBrevoLists();
    fetchBrevoTemplates();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription")
        .select("id, title")
        .order("title");

      if (error) {
        console.error("Error fetching subscriptions:", error);
        toast.error("Failed to load subscriptions");
      } else {
        setSubscriptions(data || []);
        if (data && data.length > 0) {
          form.setValue("subscription_id", data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
      toast.error("Failed to load subscriptions");
    }
  };

  const fetchBrevoLists = async () => {
    setLoadingLists(true);
    try {
      const response = await fetch("/api/brevo?resource=lists");
      const data = await response.json();
      if (data && data.lists) {
        setBrevoLists(data.lists);
      } else {
        console.error("Unexpected API response format:", data);
        toast.error("Failed to parse contact lists data");
      }
    } catch (error) {
      console.error("Error fetching Brevo lists:", error);
      toast.error("Failed to load contact lists");
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchBrevoTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch("/api/brevo?resource=templates");
      const data = await response.json();
      if (data && data.templates) {
        setBrevoTemplates(data.templates);
      } else {
        console.error("Unexpected API response format:", data);
        toast.error("Failed to parse email templates data");
      }
    } catch (error) {
      console.error("Error fetching Brevo templates:", error);
      toast.error("Failed to load email templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("code", result);
  };

  const validateStep1 = () => {
    const { name, code, subscription_id, expiry_date, uses_per_user } =
      form.getValues();

    // Check required fields
    if (!name || !code || !subscription_id || !expiry_date || !uses_per_user) {
      toast.error("Please fill all required fields");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    try {
      // Validate based on access type
      const filteredDomains =
        values.allowed_domains?.filter((d) => d.trim() !== "") || [];
      const filteredEmails =
        values.allowed_emails?.filter((e) => e.trim() !== "") || [];

      if (values.access_type === "domain" && filteredDomains.length === 0) {
        toast.error("At least one domain is required");
        setLoading(false);
        return;
      }

      if (values.access_type === "email" && filteredEmails.length === 0) {
        toast.error("At least one email address is required");
        setLoading(false);
        return;
      }

      if (values.access_type === "list" && !values.email_list_id) {
        toast.error("Please select a contact list");
        setLoading(false);
        return;
      }

      // Validate email settings if sending emails
      if (values.send_email) {
        if (!values.email_template_id) {
          toast.error("Email template is required");
          setLoading(false);
          return;
        }
      }

      // Create the promo code
      const promoCodeData = {
        id: uuidv4(),
        name: values.name,
        code: values.code,
        subscription_id: values.subscription_id,
        expiry_date: values.expiry_date.toISOString(),
        is_domain_specific: values.access_type === "domain",
        allowed_domains: values.access_type === "domain" ? filteredDomains : [],
        allowed_emails: values.access_type === "email" ? filteredEmails : [],
        max_uses: values.max_uses ? Number(values.max_uses) : null,
        uses_per_user: Number(values.uses_per_user),
        active: values.active,
      };

      const { error } = await supabase.from("promo_code").insert(promoCodeData);

      if (error) {
        console.error("Error adding promo code:", error);
        if (error.code === "23505") {
          toast.error("This code already exists. Please choose another.");
        } else {
          toast.error("Error adding promo code. Please try again later.");
        }
        return;
      }

      toast.success("Promo code created successfully!");

      // If send email is enabled, send the emails
      if (values.send_email) {
        try {
          const emailData = {
            promo_code: values.code,
            subject: values.email_subject || `Your Promo Code: ${values.code}`,
            templateId: values.email_template_id,
            ...(values.access_type === "list" || values.access_type === "all"
              ? { listId: values.email_list_id }
              : {
                  emails: values.access_type === "email" ? filteredEmails : [],
                }),
          };

          const emailResponse = await fetch("/api/send-promo-emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailData),
          });

          const emailResult = await emailResponse.json();

          if (emailResponse.ok) {
            toast.success("Emails sent successfully!");
          } else {
            toast.error(
              `Failed to send emails: ${emailResult.error || "Unknown error"}`
            );
          }
        } catch (emailError) {
          console.error("Error sending emails:", emailError);
          toast.error("Failed to send emails. Please try again later.");
        }
      }

      onPromoCodeAdded();
      onClose();
    } catch (err) {
      console.error("Error in form submission:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Add New Promo Code" : "Access & Email Settings"}
            <div className="mt-2 text-sm text-gray-500 font-normal">
              Step {step} of 2
            </div>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            {step === 1 ? (
              // Step 1: Basic Promo Code Details
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Summer Sale 2023" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} placeholder="e.g. SUMMER23" />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateRandomCode}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" /> Generate
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subscription_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Subscription <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subscription" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subscriptions.map((subscription) => (
                            <SelectItem
                              key={subscription.id}
                              value={subscription.id}
                            >
                              {subscription.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Expiry Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="max_uses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Uses</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Unlimited"
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for unlimited uses
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="uses_per_user"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Uses Per User <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable or disable this promo code
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  <Button variant="outline" type="button" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNextStep();
                    }}
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              // Step 2: Access Control & Email Settings
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="access_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Control</FormLabel>
                      <FormDescription>
                        Choose who can use this promo code
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1 mt-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="all" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Anyone can use this code
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="domain" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Restrict to specific email domains
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="email" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Restrict to specific email addresses
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="list" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Restrict to a Brevo contact list
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("access_type") === "domain" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>
                        Allowed Domains <span className="text-red-500">*</span>
                      </FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentDomains =
                            form.getValues("allowed_domains") || [];
                          form.setValue("allowed_domains", [
                            ...currentDomains,
                            "",
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {form.watch("allowed_domains")?.map((domain, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={domain}
                            onChange={(e) => {
                              const newDomains = [
                                ...(form.getValues("allowed_domains") || []),
                              ];
                              newDomains[index] = e.target.value;
                              form.setValue("allowed_domains", newDomains);
                            }}
                            placeholder="e.g. company.com"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newDomains = [
                                ...(form.getValues("allowed_domains") || []),
                              ];
                              if (newDomains.length > 1) {
                                newDomains.splice(index, 1);
                                form.setValue("allowed_domains", newDomains);
                              }
                            }}
                            disabled={
                              (form.watch("allowed_domains") || []).length <= 1
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {form.watch("access_type") === "email" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>
                        Allowed Emails <span className="text-red-500">*</span>
                      </FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentEmails =
                            form.getValues("allowed_emails") || [];
                          form.setValue("allowed_emails", [
                            ...currentEmails,
                            "",
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {form.watch("allowed_emails")?.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={email}
                            onChange={(e) => {
                              const newEmails = [
                                ...(form.getValues("allowed_emails") || []),
                              ];
                              newEmails[index] = e.target.value;
                              form.setValue("allowed_emails", newEmails);
                            }}
                            placeholder="e.g. user@example.com"
                            type="email"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newEmails = [
                                ...(form.getValues("allowed_emails") || []),
                              ];
                              if (newEmails.length > 1) {
                                newEmails.splice(index, 1);
                                form.setValue("allowed_emails", newEmails);
                              }
                            }}
                            disabled={
                              (form.watch("allowed_emails") || []).length <= 1
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {form.watch("access_type") === "list" && (
                  <FormField
                    control={form.control}
                    name="email_list_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Contact List <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a contact list" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingLists ? (
                              <SelectItem value="loading" disabled>
                                Loading lists...
                              </SelectItem>
                            ) : brevoLists.length > 0 ? (
                              brevoLists.map((list) => (
                                <SelectItem
                                  key={list.id}
                                  value={String(list.id)}
                                >
                                  {list.name} ({list.totalSubscribers || 0}{" "}
                                  contacts)
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No lists found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="send_email"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Send Email</FormLabel>
                        <FormDescription>
                          Send promo code via email after creation
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("send_email") && (
                  <>
                    <FormField
                      control={form.control}
                      name="email_template_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Email Template{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an email template" />
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

                    <FormField
                      control={form.control}
                      name="email_subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Subject</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your Promo Code" />
                          </FormControl>
                          <FormDescription>
                            Leave empty to use the default subject
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handlePreviousStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Promo Code"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
