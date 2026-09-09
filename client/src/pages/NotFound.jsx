import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <span className="w-16 h-16 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-8 h-8">
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m21 21-4.3-4.3M9 11h4" />
        </svg>
      </span>
      <h1 className="text-3xl font-bold text-slate-900 mb-1">Page not found</h1>
      <p className="text-slate-500 mb-6 max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/"
        className="bg-teal-700 text-white font-semibold text-sm rounded-full px-6 py-2.5 hover:bg-teal-800 transition"
      >
        Go back home
      </Link>
    </div>
  );
}

export default NotFound;
