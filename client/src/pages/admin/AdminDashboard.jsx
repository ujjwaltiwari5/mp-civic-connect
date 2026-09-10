import { Link } from "react-router-dom";
import AnalyticsOverview from "../../components/AnalyticsOverview";

const CARDS = [
  {
    to: "/admin/complaints",
    title: "All Complaints",
    desc: "View, filter, search and sort every complaint. Assign to a department and check priority.",
    accent: "bg-teal-50 text-teal-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M4 12h16M4 19h10" />
      </svg>
    ),
  },
  {
    to: "/admin/duplicates",
    title: "Duplicate Review",
    desc: "Confirm or dismiss complaints the system flagged as possible duplicates.",
    accent: "bg-purple-50 text-purple-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="4" y="4" width="12" height="12" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2" />
      </svg>
    ),
  },
  {
    to: "/admin/departments",
    title: "Departments",
    desc: "Add and edit the civic departments complaints get assigned to (Water Works, Roads, ...).",
    accent: "bg-blue-50 text-blue-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V6l8-3 8 3v15M9 21v-5h6v5" />
      </svg>
    ),
  },
  {
    to: "/admin/categories",
    title: "Categories",
    desc: "Manage complaint categories and how much weight each carries in the priority score.",
    accent: "bg-amber-50 text-amber-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0L4 14.8a2 2 0 0 1 0-2.8L12 4h6a2 2 0 0 1 2 2v6.6Z" />
        <circle cx="14.5" cy="9.5" r="1" />
      </svg>
    ),
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mb-6">Manage complaints, departments and categories.</p>
                 <AnalyticsOverview />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CARDS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:-translate-y-0.5 hover:border-teal-300 transition"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${c.accent}`}>
                {c.icon}
              </div>
              <h2 className="font-semibold text-slate-900 mb-1">{c.title}</h2>
              <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}