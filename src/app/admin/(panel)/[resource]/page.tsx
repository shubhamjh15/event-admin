import { Suspense } from "react";
import { notFound } from "next/navigation";
import { resourceMap } from "@/lib/resources";
import { ResourceList } from "@/components/admin/resource-list";

export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!resourceMap[resource]) notFound();
  return (
    <Suspense>
      <ResourceList resourceKey={resource} />
    </Suspense>
  );
}
