"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { CollectionView } from "@/components/dashboard/collection-view";

export default function FolderPage() {
  const params = useParams();
  const folderId = params.id as string;

  return (
    <AppShell>
      <CollectionView folderId={folderId} />
    </AppShell>
  );
}
