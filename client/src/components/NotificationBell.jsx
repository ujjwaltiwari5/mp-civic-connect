import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markNotificationRead } from "../services/notifications";

const TYPE_DOT = {
  assignment: "bg-blue-500",
  status_update: "bg-amber-500",
  verification_confirmed: "bg-green-500",
  verification_rejected: "bg-red-500",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getNotifications()
      .then((res) => setNotifications(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (n) => {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      markNotificationRead(n._id).catch(() => {});
    }
    setOpen(false);
    if (n.complaint?._id) {
      navigate(`/complaints/${n.complaint._id}`);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-lg z-30">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No notifications yet.</p>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition ${
                    !n.read ? "bg-teal-50/60" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[n.type] || "bg-slate-400"}`} />
                    <div className="flex-1">
                      <p className={`text-sm ${!n.read ? "font-medium text-slate-900" : "text-slate-600"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}