import { notFound } from "next/navigation";
import RolView from "@/components/RolView";
import { ROLES } from "@/lib/roles";

export function generateStaticParams() {
  return Object.keys(ROLES).map((rol) => ({ rol }));
}

export const dynamicParams = false;

export default async function RolPage({ params }: { params: Promise<{ rol: string }> }) {
  const { rol } = await params;
  const config = ROLES[rol];
  if (!config) notFound();
  return <RolView rol={config} />;
}
