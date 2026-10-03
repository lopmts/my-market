import { AdminDashboard } from "@/components/admin/dashboard/admin-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel | Administração",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
