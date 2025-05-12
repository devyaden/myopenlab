"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Subscription {
  id: string;
  title: string;
  description: string | null;
  price: number;
  duration: number;
  features: string[];
  active: boolean;
}

interface EditSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onSubscriptionUpdated: () => void;
}

export function EditSubscriptionModal({
  isOpen,
  onClose,
  subscription,
  onSubscriptionUpdated,
}: EditSubscriptionModalProps) {
  const [title, setTitle] = useState(subscription.title);
  const [description, setDescription] = useState(
    subscription.description || ""
  );
  const [price, setPrice] = useState(subscription.price.toString());
  const [duration, setDuration] = useState(subscription.duration.toString());
  const [features, setFeatures] = useState<string[]>(
    subscription.features.length > 0 ? subscription.features : [""]
  );
  const [active, setActive] = useState(subscription.active);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTitle(subscription.title);
    setDescription(subscription.description || "");
    setPrice(subscription.price.toString());
    setDuration(subscription.duration.toString());
    setFeatures(
      subscription.features.length > 0 ? subscription.features : [""]
    );
    setActive(subscription.active);
  }, [subscription]);

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([...features, ""]);
  };

  const removeFeature = (index: number) => {
    if (features.length > 1) {
      const newFeatures = [...features];
      newFeatures.splice(index, 1);
      setFeatures(newFeatures);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Title is required";
    if (!price.trim()) newErrors.price = "Price is required";
    else if (isNaN(Number(price)) || Number(price) < 0)
      newErrors.price = "Price must be a valid number";

    if (!duration.trim()) newErrors.duration = "Duration is required";
    else if (
      isNaN(Number(duration)) ||
      Number(duration) <= 0 ||
      !Number.isInteger(Number(duration))
    )
      newErrors.duration = "Duration must be a positive integer";

    const validFeatures = features.filter((f) => f.trim() !== "");
    if (validFeatures.length === 0)
      newErrors.features = "At least one feature is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const filteredFeatures = features.filter((f) => f.trim() !== "");

    const { error } = await supabase
      .from("subscription")
      .update({
        title,
        description: description || null,
        price: Number(price),
        duration: Number(duration),
        features: filteredFeatures,
        active,
      })
      .eq("id", subscription.id);

    setLoading(false);

    if (error) {
      console.error("Error updating subscription:", error);
      return;
    }

    onSubscriptionUpdated();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Premium Plan"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <span className="text-sm text-red-500">{errors.title}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter subscription description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Price ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="49.99"
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && (
                <span className="text-sm text-red-500">{errors.price}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">
                Duration (days) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                type="number"
                min="1"
                step="1"
                placeholder="30"
                className={errors.duration ? "border-red-500" : ""}
              />
              {errors.duration && (
                <span className="text-sm text-red-500">{errors.duration}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="features">
                Features <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeature}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {errors.features && (
              <span className="text-sm text-red-500">{errors.features}</span>
            )}
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder={`Feature ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(index)}
                    disabled={features.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="active">Active</Label>
            <Badge variant={active ? "default" : "outline"} className="ml-2">
              {active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Updating..." : "Update Subscription"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
