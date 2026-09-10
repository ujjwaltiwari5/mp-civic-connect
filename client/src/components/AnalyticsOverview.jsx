import { useEffect, useState } from "react";
import {
  getAnalyticsOverview,
  getAnalyticsByCategory,
  getAnalyticsByDepartment,
  getAnalyticsResolutionTime,
} from "../services/analytics";
import { STATUS_META } from "./StatusBadge";

function StatTile({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent || "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function BarRow({ label, count, max, colorClass = "bg-teal-600" }) {
  const pct = max > 0 ? Math.max(4, (count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-32 shrink-0 truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-700 w-10 text-right">{count}</span>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export default function AnalyticsOverview() {
  const [overview, setOverview] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [byDepartment, setByDepartment] = useState([]);
  const [resolutionTime, setResolutionTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getAnalyticsOverview(),
      getAnalyticsByCategory(),
      getAnalyticsByDepartment(),
      getAnalyticsResolutionTime(),
    ])
      .then(([overviewRes, categoryRes, departmentRes, resTimeRes]) => {
        setOverview(overviewRes.data.data);
        setByCategory(categoryRes.data.data);
        setByDepartment(departmentRes.data.data);
        setResolutionTime(resTimeRes.data.data);
      })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500 mb-6">Analytics loading...</p>;
  if (error) return <p className="text-sm text-red-600 mb-6">{error}</p>;
  if (!overview) return null;

  const pending = overview.byStatus.submitted + overview.byStatus.assigned + overview.byStatus.in_progress;
  const resolvedClosed = overview.byStatus.resolved + overview.byStatus.closed;
  const avgResolutionDays =
    overview.avgResolutionHours != null ? (overview.avgResolutionHours / 24).toFixed(1) : "—";

  const statusMax = Math.max(1, ...Object.values(overview.byStatus));
  const categoryMax = Math.max(1, ...byCategory.map((c) => c.count));
  const departmentMax = Math.max(1, ...byDepartment.map((d) => d.count));
  const resTimeMax = Math.max(1, ...resolutionTime.byCategory.map((c) => c.avgResolutionHours));

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatTile label="Total Complaints" value={overview.totalComplaints} />
        <StatTile label="Pending" value={pending} accent="text-amber-600" />
        <StatTile label="Resolved + Closed" value={resolvedClosed} accent="text-green-600" />
        <StatTile label="Avg Resolution Time" value={`${avgResolutionDays} days`} accent="text-teal-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Complaints by Status">
          {Object.entries(overview.byStatus).map(([status, count]) => (
            <BarRow
              key={status}
              label={STATUS_META[status]?.label || status}
              count={count}
              max={statusMax}
              colorClass={STATUS_META[status]?.dot || "bg-slate-500"}
            />
          ))}
        </ChartCard>

        <ChartCard title="Complaints by Category">
          {byCategory.length === 0 && <p className="text-xs text-slate-400">No Data Available.</p>}
          {byCategory.map((c) => (
            <BarRow key={c.categoryId} label={c.name} count={c.count} max={categoryMax} />
          ))}
        </ChartCard>

        <ChartCard title="Complaints by Department">
          {byDepartment.length === 0 && <p className="text-xs text-slate-400">No Data Available.</p>}
          {byDepartment.map((d) => (
            <BarRow key={d.departmentId} label={d.name} count={d.count} max={departmentMax} colorClass="bg-blue-600" />
          ))}
        </ChartCard>

        <ChartCard title="Avg Resolution Time by Category (hours)">
          {resolutionTime.byCategory.length === 0 && <p className="text-xs text-slate-400">No Data Available.</p>}
          {resolutionTime.byCategory.map((c) => (
            <BarRow
              key={c.categoryId}
              label={c.name}
              count={c.avgResolutionHours}
              max={resTimeMax}
              colorClass="bg-amber-500"
            />
          ))}
        </ChartCard>
      </div>
    </div>
  );
}