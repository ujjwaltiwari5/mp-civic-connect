import { Link } from "react-router-dom";

const CARDS = [
  { to: "/admin/complaints", title: "All Complaints", desc: "View Complaints, filter/search/sort." },
  { to: "/admin/departments", title: "Departments", desc: "Add and Edit Departments." },
  { to: "/admin/categories", title: "Categories", desc: "Add and Edit Categories." },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="border rounded p-4 hover:border-teal-600 hover:shadow-sm transition"
          >
            <h2 className="font-semibold text-lg mb-1">{c.title}</h2>
            <p className="text-sm text-gray-600">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}