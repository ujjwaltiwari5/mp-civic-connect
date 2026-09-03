import { useEffect, useState } from "react";
import { getMyComplaints } from "../services/complaints";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    getMyComplaints().then((res) => setComplaints(res.data.data));
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-4">My Complaints</h1>
      {complaints.length === 0 && <p>No complaints yet.</p>}
      {complaints.map((c) => (
        <div key={c._id} className="border rounded p-3 mb-3">
          <div className="flex justify-between">
            <span className="font-semibold">{c.title}</span>
            <span className="text-sm px-2 py-0.5 rounded bg-gray-100">{c.status}</span>
          </div>
          <p className="text-sm text-gray-600">{c.category?.name}</p>
          <p className="text-sm mt-1">{c.description}</p>
          {c.images && c.images.length > 0 && (
            <div className="flex gap-2 mt-2">
              {c.images.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt="complaint"
                  className="w-16 h-16 object-cover rounded border"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}