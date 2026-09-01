import { useEffect, useState } from "react";
import api from "../services/api";

function Home() {
  const [status, setStatus] = useState("Checking API connection...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    api
      .get("/health")
      .then((res) => {
        setStatus(res.data.message);
        setIsError(false);
      })
      .catch(() => {
        setStatus("Could not reach the API. Is the server running?");
        setIsError(true);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Bhopal CivicConnect
      </h1>
      <p className="text-gray-600 mb-6">
        A platform for reporting and tracking civic issues in Bhopal.
      </p>
      <div
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}
      >
        {status}
      </div>
    </div>
  );
}

export default Home;