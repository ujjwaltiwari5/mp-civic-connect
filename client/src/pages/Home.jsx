import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    title: "Report an Issue",
    desc: "Submit a complaint with photos and a pinned map location in under a minute.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.5-4.2-7-7.6-7-10.8A7 7 0 0 1 19 10.2c0 3.2-2.5 6.6-7 10.8Z" />
        <circle cx="12" cy="10" r="2.4" />
      </svg>
    ),
  },
  {
    title: "Track Progress",
    desc: "Follow every update on a clear status timeline, from submission to resolution.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="12" cy="12" r="8.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
      </svg>
    ),
  },
  {
    title: "Right Department, Right Away",
    desc: "Complaints are routed to the department that owns the issue — Water, Roads, Electricity, and more.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V6l8-3 8 3v15M9 21v-5h6v5M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
      </svg>
    ),
  },
  {
    title: "Priority-Based Resolution",
    desc: "A transparent scoring engine weighs severity, location, and age so urgent issues surface first.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v18M5 4h11l-2.5 3.5L16 11H5" />
      </svg>
    ),
  },
];

export default function Home() {
  const { user } = useAuth();
  const [apiUp, setApiUp] = useState(null);

  useEffect(() => {
    api
      .get("/health")
      .then(() => setApiUp(true))
      .catch(() => setApiUp(false));
  }, []);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50">
      <section className="bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <span className="inline-block text-xs font-semibold tracking-wide uppercase bg-white/15 rounded-full px-3 py-1 mb-4">
            Municipal Corporation of MadhyaPradesh
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Report public issues.<br />See them resolved.
          </h1>
          <p className="text-teal-50/90 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Government of MadhyaPradesh connects public directly with the departments
            responsible for fixing potholes, water leaks, streetlights, and more —
            with full visibility from report to resolution.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <>
                <Link
                  to="/complaints/new"
                  className="bg-white text-teal-800 font-semibold text-sm rounded-full px-6 py-3 hover:bg-teal-50 transition"
                >
                  Report an Issue
                </Link>
                <Link
                  to="/complaints/mine"
                  className="border border-white/40 text-white font-semibold text-sm rounded-full px-6 py-3 hover:bg-white/10 transition"
                >
                  View My Complaints
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-white text-teal-800 font-semibold text-sm rounded-full px-6 py-3 hover:bg-teal-50 transition"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="border border-white/40 text-white font-semibold text-sm rounded-full px-6 py-3 hover:bg-white/10 transition"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-4 pb-8 flex justify-center">
        <span
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${
            apiUp === null
              ? "bg-slate-100 text-slate-500"
              : apiUp
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              apiUp === null ? "bg-slate-400" : apiUp ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {apiUp === null ? "Checking server..." : apiUp ? "All systems operational" : "Server unreachable"}
        </span>
      </footer>
    </div>
  );
}
