"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AddSubscriptionModal } from "@/components/admin/subscription/add-subscription-modal";
import { EditSubscriptionModal } from "@/components/admin/subscription/edit-subscription-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialogModal } from "@/components/ui/alert-dialog-modal";

interface Subscription {
  id: string;
  title: string;
  description: string | null;
  price: number;
  duration: number;
  features: string[];
  active: boolean;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subscription")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error);
    } else {
      setSubscriptions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowEditModal(true);
  };

  const handleDelete = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedSubscription) return;

    const { error } = await supabase
      .from("subscription")
      .delete()
      .eq("id", selectedSubscription.id);

    if (error) {
      console.error("Error deleting subscription:", error);
    } else {
      fetchSubscriptions();
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-gray-500">Manage your subscription plans</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Subscription
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="shadow-sm">
              <CardHeader>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-3 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{subscription.title}</CardTitle>
                  <Badge variant={subscription.active ? "default" : "outline"}>
                    {subscription.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>
                  ${subscription.price.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  {subscription.description}
                </p>
                <p className="text-sm mb-2">
                  Duration: {subscription.duration} days
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Features:</h4>
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    {subscription.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(subscription)}
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(subscription)}
                >
                  <Trash className="h-4 w-4 mr-2" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddSubscriptionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubscriptionAdded={fetchSubscriptions}
        />
      )}

      {showEditModal && selectedSubscription && (
        <EditSubscriptionModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          subscription={selectedSubscription}
          onSubscriptionUpdated={fetchSubscriptions}
        />
      )}

      <AlertDialogModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Subscription"
        description="Are you sure you want to delete this subscription? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
