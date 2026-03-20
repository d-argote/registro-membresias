import Sidebar from "@/components/layout/Sidebar";
import TopNavBar from "@/components/layout/TopNavBar";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <TopNavBar />
      {/* Main Content Canvas */}
      <main className="ml-64 mt-20 p-12 space-y-12">
        {children}
      </main>
      
      {/* Floating Action for Mobile */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Link 
          href="/dashboard/clientes/nuevo"
          className="bg-primary text-on-primary w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
        </Link>
      </div>
    </>
  );
}
