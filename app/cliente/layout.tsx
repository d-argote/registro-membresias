import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ClientTopBar from "./components/ClientTopBar";
import ClientBottomNav from "./components/ClientBottomNav";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login-cliente");
  }

  // Comprobar nombre a través de metadata o fallback
  const userName = user.user_metadata?.nombre || user.email || "Cliente";

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 font-sans min-h-screen">
      <ClientTopBar userName={userName} />
      
      {/* El padding-bottom garantiza que el content no sea tapado por la navbar inferior */}
      <main className="pt-20 px-6 pb-32 max-w-2xl mx-auto min-h-[calc(100vh-8rem)]">
        {children}
      </main>

      <ClientBottomNav />
    </div>
  );
}
