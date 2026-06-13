import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-4 py-4 md:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="surface-card h-fit p-4 lg:sticky lg:top-4">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">
              MISMAR
            </p>
            <h2 className="mt-2 text-lg font-extrabold text-navy">
              لوحة التوقعات
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              هذه نسخة تجريبية MVP مبسطة للعرض السريع.
            </p>
          </div>
          <SidebarNav />
        </aside>
        <main className="min-w-0 py-1">{children}</main>
      </div>
    </div>
  );
}
