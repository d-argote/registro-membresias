export interface MembershipAlert {
  id: string;
  clientName: string;
  endDate: string;
  daysLeft: number;
}

export const mockAlerts: MembershipAlert[] = [
  {
    id: "1",
    clientName: "Alejandro Moreno",
    endDate: "24 Oct 2023",
    daysLeft: 1,
  },
  {
    id: "2",
    clientName: "Sofía Valencia",
    endDate: "25 Oct 2023",
    daysLeft: 2,
  },
];

export const mockKpis = {
  dailyIncome: {
    value: "$12,450.00",
    subtext: "+12% vs ayer",
  },
  dailyAccesses: {
    value: "142",
    subtext: "Capacidad del recinto: 65%",
    progress: 65,
  },
  activeClients: {
    value: "1,284",
    subtext: "Suscripciones premium activas",
  },
};

export const mockProjection = {
  value: "$450,000",
  description:
    "Based on current retention trends and historical sign-up data for the quarter.",
};
