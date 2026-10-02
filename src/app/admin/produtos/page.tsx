import { AdminProductsPage } from "@/components/admin/products/admin-products-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Produtos | Administração",
  robots: { index: false, follow: false },
};

export default function AdminProductsRoute() {
  return <AdminProductsPage />;
}
