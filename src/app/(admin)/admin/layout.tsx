import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "管理画面 | SERAINE",
  description: "SERAINE管理画面",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-64px)]">
      <AdminSidebar />
      <div className="flex-1 bg-[#F5F4F0] overflow-auto">
        <div className="p-6 md:p-8 max-w-[1200px]">
          {children}
        </div>
      </div>
    </div>
  );
}
