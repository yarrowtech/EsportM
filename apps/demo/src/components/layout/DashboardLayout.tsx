import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export default function DashboardLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [activeTop, setActiveTop] = useState("Dashboard");
  const [activeSide, setActiveSide] = useState("home");
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="min-h-screen relative">
      {/* ✅ reference-like warm gradient */}
      <div className="fixed inset-0 -z-10 bg-[#ECECEC]" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute right-[-120px] top-[-120px] h-[520px] w-[520px] rounded-full bg-[#FFE9A7]/70 blur-3xl" />
        <div className="absolute left-[-140px] top-[40%] h-[520px] w-[520px] rounded-full bg-[#DDE9FF]/65 blur-3xl" />
        <div className="absolute right-[20%] bottom-[-160px] h-[520px] w-[520px] rounded-full bg-[#FFF3D7]/70 blur-3xl" />
      </div>

      <div className="max-w-[1480px] mx-auto p-3 sm:p-5">
        {/* Top header row */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[32px] sm:text-[40px] leading-tight font-medium tracking-tight">
                {title}
              </div>
              {subtitle ? (
                <div className="mt-1 text-sm text-black/55 max-w-2xl">
                  {subtitle}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="lg:hidden h-10 w-10 rounded-2xl bg-white/60 border border-black/10 grid place-items-center hover:bg-white transition active:scale-[0.98]"
                onClick={() => setDrawer(true)}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>

              <TopNav active={activeTop} onChange={setActiveTop} />
            </div>
          </div>
        </div>

        {/* Main grid: sidebar + content */}
        <div className="flex gap-5">
          <Sidebar
            activeKey={activeSide}
            onChange={setActiveSide}
            open={drawer}
            onClose={() => setDrawer(false)}
          />

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}