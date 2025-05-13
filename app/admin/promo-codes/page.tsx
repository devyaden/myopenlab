"use client";

import { AddPromoCodeModal } from "@/components/admin/promo-code/add-promo-code-modal";
import { PromoCodeDetailsModal } from "@/components/admin/promo-code/promo-code-details-modal";
import { SendPromoEmailModal } from "@/components/admin/promo-code/send-promo-email-modal";
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
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Copy, Eye, Mail, Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface PromoCode {
  id: string;
  name: string;
  code: string;
  subscription_id: string;
  subscription: {
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

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(
    null
  );

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("promo_code")
        .select(
          `
          *,
          subscription:subscription_id(title),
          _count:user_subscription(count)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching promo codes:", error);
      } else if (data) {
        // Safely cast the data to the PromoCode type
        setPromoCodes(data as unknown as PromoCode[]);
      }
    } catch (err) {
      console.error("Failed to fetch promo codes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleViewDetails = (promoCode: PromoCode) => {
    setSelectedPromoCode(promoCode);
    setShowDetailsModal(true);
  };

  const handleDelete = (promoCode: PromoCode) => {
    setSelectedPromoCode(promoCode);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPromoCode) return;

    const { error } = await supabase
      .from("promo_code")
      .delete()
      .eq("id", selectedPromoCode.id);

    if (error) {
      console.error("Error deleting promo code:", error);
      toast.error("Failed to delete promo code. Please try again.");
    } else {
      fetchPromoCodes();
      setShowDeleteModal(false);
      toast.success("Promo code deleted successfully.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Promo code copied to clipboard.");
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const handleSendEmail = (promoCode: PromoCode) => {
    setSelectedPromoCode(promoCode);
    setShowEmailModal(true);
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Promo Codes</h1>
          <p className="text-gray-500">Manage your subscription promo codes</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Promo Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Promo Codes</CardTitle>
          <CardDescription>
            View and manage all promo codes for your subscriptions
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
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-6 text-gray-500"
                      >
                        No promo codes found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    promoCodes.map((promoCode) => (
                      <TableRow key={promoCode.id}>
                        <TableCell className="font-medium">
                          {promoCode.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">
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
                        </TableCell>
                        <TableCell>
                          {promoCode.subscription?.title || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              isExpired(promoCode.expiry_date)
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {format(
                              new Date(promoCode.expiry_date),
                              "MMM d, yyyy"
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {promoCode._count?.user_subscription || 0}
                          {promoCode.max_uses && ` / ${promoCode.max_uses}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              !promoCode.active ||
                              isExpired(promoCode.expiry_date)
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
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(promoCode)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendEmail(promoCode)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              onClick={() => handleDelete(promoCode)}
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

      {showAddModal && (
        <AddPromoCodeModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onPromoCodeAdded={fetchPromoCodes}
        />
      )}

      {showDetailsModal && selectedPromoCode && (
        <PromoCodeDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          promoCode={selectedPromoCode}
        />
      )}

      {showEmailModal && selectedPromoCode && (
        <SendPromoEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          promoCode={selectedPromoCode}
        />
      )}

      <AlertDialogModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Promo Code"
        description="Are you sure you want to delete this promo code? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
      />
    </div>
  );
}
