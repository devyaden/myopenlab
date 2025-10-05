import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { getUserFeatureLimits } from "@/lib/subscription-features";

export function useSubscriptionLimits(userId: string | undefined) {
  const [limits, setLimits] = useState({
    maxDiagrams: 1,
    canUseAI: true,
    aiRequestsRemaining: 5,
    isPaidUser: false,
  });
  const [currentDiagramCount, setCurrentDiagramCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchLimits = async () => {
      try {
        // Get feature limits
        const featureLimits = await getUserFeatureLimits(userId);

        // Get current diagram count
        const { count: diagramCount } = await supabase
          .from("canvas")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        // Get AI usage for current month
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const { data: aiUsage } = await supabase
          .from("ai_usage")
          .select("count")
          .eq("user_id", userId)
          .eq("month", currentMonth)
          .eq("year", currentYear)
          .single();

        // Check if user has active subscription
        const { data: subscription } = await supabase
          .from("user_subscription")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .gte("end_date", now.toISOString())
          .single();

        const isPaidUser = !!subscription;
        const aiUsedThisMonth = aiUsage?.count || 0;
        const aiLimit = isPaidUser ? 999999 : 5;

        setLimits({
          maxDiagrams: featureLimits.MAX_DIAGRAMS,
          canUseAI: featureLimits.ALLOW_AI_FEATURES,
          aiRequestsRemaining: Math.max(0, aiLimit - aiUsedThisMonth),
          isPaidUser,
        });
        setCurrentDiagramCount(diagramCount || 0);
      } catch (error) {
        console.error("Error fetching subscription limits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [userId]);

  const canCreateDiagram = () => {
    if (limits.isPaidUser) return true;
    return currentDiagramCount < limits.maxDiagrams;
  };

  const canUseAI = () => {
    if (limits.isPaidUser) return true;
    return limits.canUseAI && limits.aiRequestsRemaining > 0;
  };

  const refreshLimits = async () => {
    if (!userId) return;

    try {
      const featureLimits = await getUserFeatureLimits(userId);
      const { count: diagramCount } = await supabase
        .from("canvas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      setCurrentDiagramCount(diagramCount || 0);
      setLimits((prev) => ({
        ...prev,
        maxDiagrams: featureLimits.MAX_DIAGRAMS,
      }));
    } catch (error) {
      console.error("Error refreshing limits:", error);
    }
  };

  return {
    limits,
    currentDiagramCount,
    loading,
    canCreateDiagram,
    canUseAI,
    refreshLimits,
  };
}
