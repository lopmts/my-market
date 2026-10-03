import { AdminCategoriesPage } from "@/components/admin/categories/admin-categories-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categorias | Administração",
  robots: { index: false, follow: false },
};

export default function AdminCategoriesRoute() {
  return <AdminCategoriesPage />;
}
