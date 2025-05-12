"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";

interface PromoCode {
  id: string;
  name: string;
  code: string;
  subscription_id: string;
  subscription?: {
    title: string;
  };
  expiry_date: string;
  is_domain_specific: boolean;
  allowed_domains: string[];
  allowed_emails: string[];
  max_uses: number | null;
  uses_per_user: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    user_subscription: number;
  };
}

interface UserSubscription {
  id: string;
  user_id: string;
  user: {
    email: string;
    name: string;
  };
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface PromoCodeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoCode: PromoCode;
}

export function PromoCodeDetailsModal({
  isOpen,
  onClose,
  promoCode,
}: PromoCodeDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<
    UserSubscription[]
  >([]);

  useEffect(() => {
    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen, promoCode.id]);

  const fetchDetails = async () => {
    setLoading(true);

    // Fetch subscription details
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscription")
      .select("*")
      .eq("id", promoCode.subscription_id)
      .single();

    if (subscriptionError) {
      console.error("Error fetching subscription details:", subscriptionError);
    } else {
      setSubscriptionDetails(subscriptionData);
    }

    // Fetch user subscriptions using this promo code
    const { data: userSubsData, error: userSubsError } = await supabase
      .from("user_subscription")
      .select(
        `
        *,
        user:user_id (email, name)
      `
      )
      .eq("promo_code_id", promoCode.id)
      .order("created_at", { ascending: false });

    if (userSubsError) {
      console.error("Error fetching user subscriptions:", userSubsError);
    } else {
      setUserSubscriptions(userSubsData || []);
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Promo code copied to clipboard.");
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Promo Code Details: {promoCode.name}
            <Badge
              variant={
                !promoCode.active || isExpired(promoCode.expiry_date)
                  ? "destructive"
                  : "default"
              }
            >
              {!promoCode.active
                ? "Inactive"
                : isExpired(promoCode.expiry_date)
                  ? "Expired"
                  : "Active"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Code Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Code</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {promoCode.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(promoCode.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Subscription</h3>
                  <p className="text-sm mt-1">
                    {subscriptionDetails?.title ||
                      promoCode.subscription?.title ||
                      "Loading..."}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Expiry Date</h3>
                  <p className="text-sm mt-1">
                    {format(new Date(promoCode.expiry_date), "MMMM d, yyyy")}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Usage Limits</h3>
                  <p className="text-sm mt-1">
                    {promoCode._count?.user_subscription || 0} used
                    {promoCode.max_uses && ` / ${promoCode.max_uses} max`}
                  </p>
                  <p className="text-sm">
                    {promoCode.uses_per_user} use
                    {promoCode.uses_per_user !== 1 && "s"} per user
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Created At</h3>
                  <p className="text-sm mt-1">
                    {format(new Date(promoCode.created_at), "MMMM d, yyyy")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Restrictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Type</h3>
                  <p className="text-sm mt-1">
                    {promoCode.is_domain_specific
                      ? "Domain specific"
                      : "Email specific"}
                  </p>
                </div>

                {promoCode.is_domain_specific ? (
                  <div>
                    <h3 className="text-sm font-medium">Allowed Domains</h3>
                    <div className="mt-2 space-y-1">
                      {promoCode.allowed_domains.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No domains specified
                        </p>
                      ) : (
                        promoCode.allowed_domains.map((domain, index) => (
                          <Badge key={index} variant="outline" className="mr-1">
                            {domain}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium">Allowed Emails</h3>
                    <div className="mt-2 space-y-1">
                      {promoCode.allowed_emails.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No emails specified
                        </p>
                      ) : (
                        promoCode.allowed_emails.map((email, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="mr-1 mb-1 inline-block"
                          >
                            {email}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-gray-500">
                  Loading user subscriptions...
                </p>
              ) : userSubscriptions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No users have used this promo code yet.
                </p>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-2 text-left">User</th>
                        <th className="py-2 px-2 text-left">Email</th>
                        <th className="py-2 px-2 text-left">Start Date</th>
                        <th className="py-2 px-2 text-left">End Date</th>
                        <th className="py-2 px-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userSubscriptions.map((subscription) => (
                        <tr key={subscription.id} className="border-b">
                          <td className="py-2 px-2">
                            {subscription.user.name || "N/A"}
                          </td>
                          <td className="py-2 px-2">
                            {subscription.user.email}
                          </td>
                          <td className="py-2 px-2">
                            {format(
                              new Date(subscription.start_date),
                              "MMM d, yyyy"
                            )}
                          </td>
                          <td className="py-2 px-2">
                            {format(
                              new Date(subscription.end_date),
                              "MMM d, yyyy"
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <Badge
                              variant={
                                subscription.is_active
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {subscription.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
