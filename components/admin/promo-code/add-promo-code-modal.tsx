"use client";

import { DatePicker } from "@/components/ui";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Plus, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

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
  expiry_date: z.date(),
  max_uses: z.string().optional(),
  uses_per_user: z.string().min(1, "Uses per user is required"),
  active: z.boolean().default(true),
  access_type: z.enum(["all", "domain", "email"]).default("all"),
  allowed_domains: z.array(z.string()).default([""]),
  allowed_emails: z.array(z.string()).default([""]),
});

type FormValues = z.infer<typeof formSchema>;

export function AddPromoCodeModal({
  isOpen,
  onClose,
  onPromoCodeAdded,
}: AddPromoCodeModalProps) {
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

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
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptions();
      form.reset({
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
      });
    }
  }, [isOpen]);

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

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("code", result);
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
          <DialogTitle>Add New Promo Code</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
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
                      <Input
                        {...field}
                        placeholder="e.g. SUMMER23"
                        maxLength={8}
                      />
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
                    <DatePicker date={field.value} setDate={field.onChange} />
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
              name="access_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Control</FormLabel>
                  <FormDescription>
                    Choose who can use this promo code
                  </FormDescription>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select access type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">
                        Anyone can use this code
                      </SelectItem>
                      <SelectItem value="domain">
                        Restrict to specific email domains
                      </SelectItem>
                      <SelectItem value="email">
                        Restrict to specific email addresses
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                      form.setValue("allowed_domains", [...currentDomains, ""]);
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
                        placeholder="e.g. example.com"
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
                      form.setValue("allowed_emails", [...currentEmails, ""]);
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

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Promo Code"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
