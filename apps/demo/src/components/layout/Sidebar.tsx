// // components/layout/Sidebar.tsx
// import React from 'react';
// import { NeoButton } from '../ui/NeoButton';

// const NAV_ITEMS = ['Profile', 'Performance', 'Statistics', 'Transfers', 'Social', 'Health'];

// export const Sidebar: React.FC = () => {
//   return (
//     <aside className="w-full lg:w-72 flex-shrink-0 p-6 flex flex-col gap-8 bg-[#b8c0e8] rounded-r-[40px] shadow-[8px_0_16px_rgba(184,192,232,0.5)] z-10 lg:min-h-screen">
//       {/* Profile Section */}
//       <div className="flex items-center gap-4 px-2">
//         <div className="w-16 h-16 rounded-full bg-[#E5E9FA] shadow-[inset_4px_4px_8px_#c6cbe6,inset_-4px_-4px_8px_#ffffff]" />
//         <div>
//           <h2 className="font-bold text-[#3B405D] text-lg leading-tight">Player name</h2>
//           <p className="text-sm text-[#5A607F]">associated club</p>
//         </div>
//       </div>

//       {/* Navigation */}
//       <nav className="flex flex-col gap-4 mt-4">
//         {NAV_ITEMS.map((item) => (
//           <NeoButton 
//             key={item} 
//             isActive={item === 'Profile'} // Example active state
//             className="justify-start px-8 rounded-full py-4 text-base font-semibold"
//           >
//             {item}
//           </NeoButton>
//         ))}
//       </nav>
//     </aside>
//   );
// };



























import { motion } from "framer-motion";
import {
  Home,
  Users,
  Activity,
  CalendarDays,
  HeartPulse,
  BarChart3,
  Wallet,
  HelpCircle,
} from "lucide-react";

const items = [
  { key: "home", label: "Home", icon: Home },
  { key: "squads", label: "Squads", icon: Users },
  { key: "training", label: "Training", icon: Activity },
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "medical", label: "Medical", icon: HeartPulse },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "billing", label: "Billing", icon: Wallet },
  { key: "help", label: "Help", icon: HelpCircle },
];

const LOGO_DARK_SRC = "/logo/logo-dark.png";

export function Sidebar({
  activeKey,
  onChange,
  open,
  onClose,
}: {
  activeKey: string;
  onChange: (k: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const content = (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-6">
        <img
          src={LOGO_DARK_SRC}
          alt="EsportM"
          className="h-8 w-auto max-w-[150px] object-contain"
        />
        <div className="text-xs text-black/50 mt-1">Sports Management Console</div>
      </div>

      <div className="px-3 mt-6 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = activeKey === it.key;
          return (
            <button
              key={it.key}
              onClick={() => {
                onChange(it.key);
                onClose();
              }}
              className={[
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition",
                active
                  ? "bg-black text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
                  : "hover:bg-white/70 text-black/75",
              ].join(" ")}
            >
              <Icon size={18} />
              <span className="font-medium">{it.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-3xl bg-white/60 border border-black/10 p-4">
          <div className="text-xs text-black/50">Next Match</div>
          <div className="mt-1 font-semibold">Falcons vs Rangers</div>
          <div className="text-xs text-black/45 mt-1">Sat • 6:30 PM • Arena 2</div>
        </div>
      </div>
    </div>
  );

  // Desktop sidebar
  return (
    <>
      <div className="hidden lg:block w-[280px] h-full">
  <div className="h-[calc(100vh-2rem)] rounded-[34px] bg-white/60 border border-black/10 overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.10)]">
    {content}
  </div>
</div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute left-3 top-3 bottom-3 w-[86vw] max-w-[340px] rounded-[34px] bg-white/75 border border-black/10 overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
          >
            {content}
          </motion.div>
        </div>
      )}
    </>
  );
}
