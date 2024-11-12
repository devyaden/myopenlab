"use client";

import { ReactFlowProvider } from "reactflow";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}
