import { ExplorationApp } from "@/components/explore/ExplorationApp";

// Standalone exploration surface (the future explorer-role landing place). The
// same ExplorationApp the in-app overlay renders — one code path, two entry points.
export default function ExplorePage() {
  return <ExplorationApp variant="standalone" />;
}
