export default function TopNavBar() {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-20 z-40 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50">
      <div className="flex justify-between items-center px-12 h-full">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-outline">search</span>
          <input
            type="text"
            className="bg-transparent border-none focus:ring-0 text-[10px] tracking-[0.15em] font-bold text-on-surface-variant w-64 placeholder:text-outline-variant outline-none"
            placeholder="BUSCAR CLIENTE..."
          />
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6">
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:opacity-70 transition-opacity">
              notifications
            </span>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:opacity-70 transition-opacity">
              settings
            </span>
          </div>
          <div className="flex items-center gap-3 border-l border-outline-variant/30 pl-8">
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-widest text-on-surface uppercase">
                Admin User
              </p>
              <p className="text-[8px] font-medium text-outline uppercase tracking-tighter">
                Command Center Access
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAY4JFPjp5gr-jB9cp0IQyDbgIG6hpB1Hf6O22ON0klIp2tv9OD0mIngYKPOaZvbeSjTmsAXLkBo6wLZSFCxCpWv3iS2sshPIKDbAgaNyg1PPLjWpkeniElOxgdH58GSREZV9wwADQEasHSDX8duOz6Q0StLYEtf79ZRm-OKeBuBdmIkWC18tGYroAxQV6MuVmf7aHpJXvIJOR8NBEp3UrtbGPYpvbWT3-vgqSbPGrYwVnL4-1m1aVObZgzMFEH34F8q94HkoJIHqe"
              data-alt="Admin profile avatar professional portrait"
              alt="Admin User"
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
