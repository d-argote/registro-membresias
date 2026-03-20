export default function WeeklyIncomeChart() {
  return (
    <div className="col-span-8 bg-surface-container-lowest p-10 rounded-xl relative overflow-hidden">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h3 className="text-2xl font-black tracking-tighter uppercase mb-1">
            Weekly Income
          </h3>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
            Flux Performance Analysis
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] font-black text-on-surface bg-surface-container-high px-3 py-1 rounded">
            ESTA SEMANA
          </span>
          <span className="text-[10px] font-bold text-outline px-3 py-1 rounded">
            PASADA
          </span>
        </div>
      </div>
      {/* Simple Line Graph Visual (SVG Representation) */}
      <div className="w-full h-64 relative mt-8">
        <svg className="w-full h-full" viewBox="0 0 800 200">
          {/* Horizontal Grid Lines */}
          <line
            stroke="#f0f3ff"
            strokeWidth="1"
            x1="0"
            x2="800"
            y1="50"
            y2="50"
          ></line>
          <line
            stroke="#f0f3ff"
            strokeWidth="1"
            x1="0"
            x2="800"
            y1="100"
            y2="100"
          ></line>
          <line
            stroke="#f0f3ff"
            strokeWidth="1"
            x1="0"
            x2="800"
            y1="150"
            y2="150"
          ></line>

          {/* Area Gradient */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#0053db" stopOpacity="0.2"></stop>
              <stop offset="100%" stopColor="#0053db" stopOpacity="0"></stop>
            </linearGradient>
          </defs>
          <path
            d="M0,180 L50,160 L150,120 L250,140 L350,80 L450,90 L550,40 L650,60 L800,30 L800,200 L0,200 Z"
            fill="url(#chartGradient)"
          ></path>

          {/* Main Path */}
          <path
            d="M0,180 L50,160 L150,120 L250,140 L350,80 L450,90 L550,40 L650,60 L800,30"
            fill="none"
            stroke="#000000"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          ></path>

          {/* Interactive Points */}
          <circle cx="550" cy="40" fill="#000000" r="6"></circle>
          <circle
            cx="550"
            cy="40"
            fill="#000000"
            fillOpacity="0.1"
            r="12"
          ></circle>
        </svg>

        <div className="flex justify-between mt-6 text-[10px] font-bold text-outline uppercase tracking-widest">
          <span>LUN</span>
          <span>MAR</span>
          <span>MIE</span>
          <span>JUE</span>
          <span>VIE</span>
          <span>SAB</span>
          <span>DOM</span>
        </div>
      </div>
    </div>
  );
}
