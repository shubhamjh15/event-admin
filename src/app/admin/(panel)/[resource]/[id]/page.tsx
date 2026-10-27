import { notFound } from "next/navigation";
import { resourceMap } from "@/lib/resources";
import { ResourceForm } from "@/components/admin/resource-form";

export default async function ResourceEditPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  if (!resourceMap[resource]) notFound();
  return <ResourceForm resourceKey={resource} id={id} />;
}
