interface ProjectionWidgetProps {
  value: string;
  description: string;
}

export default function ProjectionWidget({
  value,
  description,
}: ProjectionWidgetProps) {
  return (
    <div className="col-span-4 flex flex-col gap-6">
      <div className="flex-1 bg-surface-container-low p-8 rounded-xl flex flex-col justify-center gap-4">
        <span className="text-[10px] font-black tracking-[0.2em] text-outline uppercase">
          Projection
        </span>
        <h4 className="text-3xl font-black tracking-tighter">
          Est. Month-End
          <br />
          {value}
        </h4>
        <p className="text-[10px] font-medium text-on-surface-variant leading-relaxed">
          {description}
        </p>
      </div>

      <div className="h-1/3 bg-on-background p-8 rounded-xl flex items-center justify-between text-white group cursor-pointer hover:bg-surface-tint transition-all">
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase opacity-60">
            Generate
          </p>
          <h4 className="text-lg font-black tracking-tight uppercase">
            Full Audit PDF
          </h4>
        </div>
        <span className="material-symbols-outlined text-4xl group-hover:translate-x-2 transition-transform">
          arrow_forward
        </span>
      </div>
    </div>
  );
}
