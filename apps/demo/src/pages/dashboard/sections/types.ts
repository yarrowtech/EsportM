export type DashboardPoint = { x: string; y: number };

export type DashboardSeries = {
  name: string;
  points: DashboardPoint[];
};

export type DashboardKpi = {
  key: string;
  label: string;
  value: number;
};

export type DashboardOverview = {
  clubId?: string;
  kpis?: DashboardKpi[];
  player?: {
    totals?: {
      matches?: number;
      goals?: number;
      assists?: number;
      minutes?: number;
    };
  };
  work?: {
    coaching?: {
      last30Appearances?: number;
      last30Goals?: number;
      last30Assists?: number;
    };
    physio?: {
      highSeverityActive?: number;
      newThisWeek?: Array<{
        id: string;
        type: string;
        severity: string;
        createdAt: string;
        userId: string;
      }>;
    };
  };
};

export type DashboardCharts = {
  rangeDays?: number;
  series?: DashboardSeries[];
};

export type MatchItem = {
  id: string;
  title?: string | null;
  opponent?: string | null;
  kickoffAt?: string | null;
  status?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  venue?: string | null;
};

export type InjuryItem = {
  id: string;
  type: string;
  severity: string;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  userId?: string;
};

export type DashboardRecent = {
  matches?: MatchItem[];
  injuries?: InjuryItem[];
};

export function sumSeries(series: DashboardSeries | undefined) {
  return (series?.points || []).reduce((acc, p) => acc + (p?.y || 0), 0);
}

export function toDateValue(input?: string | null) {
  if (!input) return 0;
  const t = new Date(input).getTime();
  return Number.isFinite(t) ? t : 0;
}
