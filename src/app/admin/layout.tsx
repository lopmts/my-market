"use client";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useUser } from "@/hooks/use_data";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LayoutAdmin = ({ children }: LayoutProps<"/">) => {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "ADMIN") {
      router.replace("/");
      return;
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
        <Loader className="animate-spin" size={29} aria-label="Carregando" />
      </div>
    );
  }

  // Só renderiza se for ADMIN
  if (user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 lg:pl-64">
      <AdminSidebar user={user} />
      <main className="min-h-screen mx-auto w-full p-4 md:p-6">{children}</main>
    </div>
  );
};

export default LayoutAdmin;
