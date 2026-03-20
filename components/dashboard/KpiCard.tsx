interface KpiCardProps {
  title: string;
  value: string;
  subtext: string;
  bgColor?: string;
  textColor?: string;
  subtextColor?: string;
  progressValue?: number;
  hoverEffect?: boolean;
}

export default function KpiCard({
  title,
  value,
  subtext,
  bgColor = "bg-surface-container-lowest",
  textColor = "text-on-background",
  subtextColor = "text-surface-tint",
  progressValue,
  hoverEffect = false,
}: KpiCardProps) {
  // If it's the first card with specific hover effect
  if (hoverEffect) {
    return (
      <div className="col-span-4 p-8 bg-surface-container-lowest rounded-xl flex flex-col justify-between h-48 group hover:bg-primary transition-all duration-300">
        <span className="text-[10px] font-black tracking-[0.2em] text-outline group-hover:text-on-primary/60 uppercase">
          {title}
        </span>
        <div className="flex flex-col">
          <span className="text-4xl font-black tracking-tighter group-hover:text-on-primary">
            {value}
          </span>
          <span className="text-[10px] font-bold text-surface-tint group-hover:text-on-primary/80 mt-1">
            {subtext}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`col-span-4 p-8 rounded-xl flex flex-col justify-between h-48 ${bgColor} ${
        !progressValue ? "" : "border border-transparent hover:border-outline-variant transition-all"
      }`}
    >
      <span
        className={`text-[10px] font-black tracking-[0.2em] uppercase ${
          bgColor === "bg-surface-container-highest"
            ? "text-on-primary-fixed-variant"
            : "text-outline"
        }`}
      >
        {title}
      </span>
      <div className="flex flex-col">
        <span
          className={`text-4xl font-black tracking-tighter ${
            bgColor === "bg-surface-container-highest"
              ? "text-on-primary-fixed"
              : textColor
          }`}
        >
          {value}
        </span>

        {progressValue !== undefined && (
          <div className="w-full bg-surface-container-highest h-1 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-primary h-full"
              style={{ width: `${progressValue}%` }}
            ></div>
          </div>
        )}

        <span
          className={`mt-1 ${
            progressValue !== undefined
              ? "text-[10px] font-medium text-on-surface-variant mt-2"
              : `text-[10px] font-bold ${
                  bgColor === "bg-surface-container-highest"
                    ? "text-on-surface-variant opacity-60"
                    : subtextColor
                }`
          }`}
        >
          {subtext}
        </span>
      </div>
    </div>
  );
}
