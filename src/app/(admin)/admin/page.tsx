import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-[800px] mx-auto px-5 md:px-10 py-16">
      <h1 className="font-heading text-3xl md:text-4xl tracking-wide mb-8">
        管理画面
      </h1>
      <p className="text-[14px] text-deep-charcoal/60">
        管理者: {user?.email}
      </p>
    </div>
  );
}
