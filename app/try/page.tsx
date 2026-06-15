"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/landing/navbar";
import ReactFlow, { Background } from "reactflow";
import "reactflow/dist/style.css";
import {
  edgeTypes,
  nodeTypes,
  onReactFlowError,
} from "@/components/canvas-new/flow-config";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

const EXAMPLES = [
  "How we onboard a new vendor",
  "How we run a product launch",
  "How a support ticket gets resolved",
  "How we hire and onboard a new engineer",
];

// Safe, no-op-if-unavailable PostHog capture (client only).
function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  import("posthog-js")
    .then((m) => m.default?.capture?.(event, props))
    .catch(() => {});
}

interface DemoResult {
  nodes: any[];
  edges: any[];
  styles: Record<string, any>;
}

export default function TryPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [email, setEmail] = useState("");

  const generate = useCallback(async () => {
    if (prompt.trim().length < 10) {
      setError("Describe the process in a bit more detail (10+ characters).");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    capture("try.started", { promptLength: prompt.length });

    try {
      const res = await fetch("/api/public/try-playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "Something went wrong. Please try again.");
        return;
      }
      setResult(json.data);
      capture("try.generated", {
        promptLength: prompt.length,
        nodeCount: json.data?.nodes?.length ?? 0,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  const save = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!result) return;
      try {
        localStorage.setItem(
          "olab_demo_playbook",
          JSON.stringify({ prompt, ...result })
        );
        if (email) localStorage.setItem("olab_demo_email", email);
      } catch {
        // ignore storage failures
      }
      capture("try.saved", { hasEmail: Boolean(email) });
      router.push(
        `/auth/signup?seed=demo${email ? `&email=${encodeURIComponent(email)}` : ""}`
      );
    },
    [result, prompt, email, router]
  );

  const renderNodes = useMemo(() => {
    if (!result) return [];
    return result.nodes.map((node: any) => {
      const width = node.width || node.data?.width || 100;
      const height = node.height || node.data?.height || 100;
      return {
        ...node,
        width,
        height,
        data: {
          ...node.data,
          width,
          height,
          style: { ...result.styles?.[node.id], width, height },
        },
        style: { ...node.style, width, height },
      };
    });
  }, [result]);

  const renderEdges = useMemo(() => {
    if (!result) return [];
    return result.edges.map((edge: any) => ({
      ...edge,
      type: "custom",
      sourceHandle: edge.sourceHandle || "g",
      targetHandle: edge.targetHandle || "d",
      style: {
        ...(edge.style || {}),
        opacity: edge.style?.opacity ?? 1,
        strokeWidth: edge.style?.strokeWidth ?? 2,
      },
    }));
  }, [result]);

  return (
    <main className="min-h-screen text-yadn-foreground bg-yadn-background">
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Describe a process at your company in one sentence
            </h1>
            <p className="text-lg text-yadn-foreground/70 mb-8">
              Watch it become a living playbook in seconds. No signup required.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder="e.g. How we onboard a new vendor"
                className="flex-1 px-4 py-3 bg-yadn-background/60 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
              />
              <button
                onClick={generate}
                disabled={loading}
                className="px-6 py-3 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors font-medium flex items-center justify-center disabled:opacity-70 whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Building…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="mr-2" />
                    Build playbook
                  </>
                )}
              </button>
            </div>

            {!result && !loading && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    className="text-sm px-3 py-1.5 rounded-full border border-yadn-foreground/15 text-yadn-foreground/70 hover:border-yadn-accent-green/50 hover:text-yadn-foreground transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
          </div>

          {result && (
            <div className="max-w-5xl mx-auto mt-12">
              <div className="h-[420px] md:h-[520px] bg-yadn-background/40 border border-yadn-foreground/10 rounded-xl overflow-hidden">
                <ReactFlow
                  nodes={renderNodes}
                  edges={renderEdges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  onError={onReactFlowError}
                  fitView
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background />
                </ReactFlow>
              </div>

              <div className="mt-8 max-w-xl mx-auto bg-yadn-accent-green/5 border border-yadn-accent-green/20 rounded-2xl p-6 md:p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Save this playbook</h2>
                <p className="text-yadn-foreground/70 mb-6">
                  Create a free account to keep it, edit it with AI, and build
                  your company&apos;s living playbooks.
                </p>
                <form
                  onSubmit={save}
                  className="flex flex-col sm:flex-row gap-3 justify-center"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="flex-1 px-4 py-3 bg-yadn-background/60 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors font-medium flex items-center justify-center whitespace-nowrap"
                  >
                    Save &amp; continue
                    <ArrowRight size={18} className="ml-2" />
                  </button>
                </form>
                <p className="mt-4 text-sm text-yadn-foreground/50">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-yadn-accent-green hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
