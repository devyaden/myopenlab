"use client";

import { AlertDialogModal } from "@/components/ui/alert-dialog-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Check, Trash, X } from "lucide-react";
import { useEffect, useState } from "react";

interface UserSubscription {
  id: string;
  user_id: string;
  subscription_id: string;
  promo_code_id: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: {
    email: string;
    name: string;
  };
  subscription: {
    title: string;
  };
  promo_code: {
    code: string;
    name: string;
  } | null;
}

export default function UserSubscriptionsPage() {
  const [userSubscriptions, setUserSubscriptions] = useState<
    UserSubscription[]
  >([]);
  console.log(
    "🚀 ~ UserSubscriptionsPage ~ userSubscriptions:",
    userSubscriptions
  );
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<UserSubscription | null>(null);
  const { toast } = useToast();

  const fetchUserSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_subscription")
      .select(
        `
        *,
        user:user_id (id, email, name),
        subscription:subscription_id (title),
        promo_code:promo_code_id (code, name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user subscriptions:", error);
    } else {
      setUserSubscriptions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserSubscriptions();
  }, []);

  const handleDelete = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedSubscription) return;

    const { error } = await supabase
      .from("user_subscription")
      .delete()
      .eq("id", selectedSubscription.id);

    if (error) {
      console.error("Error deleting user subscription:", error);
      toast({
        title: "Error",
        description: "Failed to delete user subscription. Please try again.",
        variant: "destructive",
      });
    } else {
      fetchUserSubscriptions();
      setShowDeleteModal(false);
      toast({
        title: "Success",
        description: "User subscription deleted successfully.",
      });
    }
  };

  const toggleSubscriptionStatus = async (subscription: UserSubscription) => {
    const { error } = await supabase
      .from("user_subscription")
      .update({ is_active: !subscription.is_active })
      .eq("id", subscription.id);

    if (error) {
      console.error("Error updating subscription status:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription status. Please try again.",
        variant: "destructive",
      });
    } else {
      fetchUserSubscriptions();
      toast({
        title: "Success",
        description: `Subscription ${subscription.is_active ? "deactivated" : "activated"} successfully.`,
      });
    }
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Subscriptions</h1>
          <p className="text-gray-500">Manage all user subscriptions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All User Subscriptions</CardTitle>
          <CardDescription>
            View and manage all active and inactive user subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Promo Code</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-6 text-gray-500"
                      >
                        No user subscriptions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    userSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">
                          {subscription.user?.name || "N/A"}
                        </TableCell>
                        <TableCell>{subscription.user?.email}</TableCell>
                        <TableCell>{subscription.subscription.title}</TableCell>
                        <TableCell>
                          {subscription.promo_code ? (
                            <Badge variant="outline" className="font-mono">
                              {subscription.promo_code.code}
                            </Badge>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(subscription.start_date),
                            "MMM d, yyyy"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              isExpired(subscription.end_date)
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {format(
                              new Date(subscription.end_date),
                              "MMM d, yyyy"
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              !subscription.is_active ||
                              isExpired(subscription.end_date)
                                ? "destructive"
                                : "default"
                            }
                          >
                            {!subscription.is_active
                              ? "Inactive"
                              : isExpired(subscription.end_date)
                                ? "Expired"
                                : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                toggleSubscriptionStatus(subscription)
                              }
                              title={
                                subscription.is_active
                                  ? "Deactivate"
                                  : "Activate"
                              }
                            >
                              {subscription.is_active ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              onClick={() => handleDelete(subscription)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialogModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete User Subscription"
        description="Are you sure you want to delete this user subscription? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
      />
    </div>
  );
}
