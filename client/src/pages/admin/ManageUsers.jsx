import { useEffect, useState } from "react";
import { getUsers, updateUserRole } from "../../services/users";
import api from "../../services/api";

const ROLES = ["citizen", "department_user", "admin"];

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({}); // { [userId]: { role, department } }
  const [rowMessage, setRowMessage] = useState({}); // { [userId]: { type: "success"|"error", text } }

  const loadUsers = () => {
    setLoading(true);
    setError(false);
    getUsers({ search: search || undefined, role: roleFilter || undefined })
      .then((res) => setUsers(res.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    api.get("/departments").then((res) => setDepartments(res.data.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const getPending = (user) =>
    pendingChanges[user._id] || {
      role: user.role,
      department: user.department?._id || user.department || "",
    };

  const setPending = (user, patch) => {
    setPendingChanges((prev) => ({
      ...prev,
      [user._id]: { ...getPending(user), ...patch },
    }));
  };

  const isDirty = (user) => {
    const pending = getPending(user);
    const currentDept = user.department?._id || user.department || "";
    return pending.role !== user.role || (pending.role === "department_user" && pending.department !== currentDept);
  };

  const handleSave = async (user) => {
    const pending = getPending(user);

    if (pending.role === "department_user" && !pending.department) {
      setRowMessage((prev) => ({ ...prev, [user._id]: { type: "error", text: "Select a department first" } }));
      return;
    }

    setSavingId(user._id);
    setRowMessage((prev) => ({ ...prev, [user._id]: null }));

    try {
      const res = await updateUserRole(user._id, {
        role: pending.role,
        department: pending.role === "department_user" ? pending.department : undefined,
      });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? res.data.data : u)));
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[user._id];
        return next;
      });
      setRowMessage((prev) => ({ ...prev, [user._id]: { type: "success", text: "Updated" } }));
      setTimeout(() => {
        setRowMessage((prev) => ({ ...prev, [user._id]: null }));
      }, 2500);
    } catch (err) {
      const msg = err.response?.data?.message || "Update failed";
      setRowMessage((prev) => ({ ...prev, [user._id]: { type: "error", text: msg } }));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Manage Users</h1>
      <p className="text-sm text-slate-500 mb-6">
        Assign roles and departments. New registrations are always citizens by default.
      </p>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-teal-700 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-teal-800"
        >
          Search
        </button>
      </form>

      {loading && <p className="text-sm text-slate-500">Loading users...</p>}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4 flex items-center justify-between">
          <span>Couldn't load users.</span>
          <button onClick={loadUsers} className="font-medium underline">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Department</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const pending = getPending(user);
                const dirty = isDirty(user);
                const msg = rowMessage[user._id];
                return (
                  <tr key={user._id} className="align-middle">
                    <td className="px-4 py-2.5 text-slate-800">{user.name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{user.email}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={pending.role}
                        onChange={(e) => setPending(user, { role: e.target.value })}
                        className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      {pending.role === "department_user" ? (
                        <select
                          value={pending.department}
                          onChange={(e) => setPending(user, { department: e.target.value })}
                          className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                        >
                          <option value="">Select department</option>
                          {departments.map((d) => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {msg && (
                        <span className={`text-xs mr-2 ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                          {msg.text}
                        </span>
                      )}
                      <button
                        disabled={!dirty || savingId === user._id}
                        onClick={() => handleSave(user)}
                        className="bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-medium rounded-md px-3 py-1.5 hover:bg-teal-800"
                      >
                        {savingId === user._id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}