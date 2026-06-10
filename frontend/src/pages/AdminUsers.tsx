import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { Avatar, IconPlus, IconUsers } from "../components/icons";
import { useToastStore } from "../store";
import { Role } from "../types";

interface UserDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
}

const ROLES: Role[] = ["CREATOR", "FACHLICHER_PRUEFER", "REDAKTIONELLER_PRUEFER", "ADMIN"];

const ROLE_BADGES: Record<Role, string> = {
  CREATOR: "badge-primary badge-outline",
  FACHLICHER_PRUEFER: "badge-info badge-outline",
  REDAKTIONELLER_PRUEFER: "badge-secondary badge-outline",
  ADMIN: "badge-error badge-outline",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "CREATOR" as Role });
  const [showCreate, setShowCreate] = useState(false);
  const toast = useToastStore((s) => s.push);

  const load = useCallback(() => {
    api<UserDto[]>("/api/users").then(setUsers).catch((e) => toast("error", e.message));
  }, [toast]);

  useEffect(load, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api("/api/users", { method: "POST", body: JSON.stringify(form) });
      toast("success", "Benutzer angelegt");
      setForm({ email: "", name: "", password: "", role: "CREATOR" });
      setShowCreate(false);
      load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Fehler");
    }
  };

  const update = async (id: string, patch: Partial<UserDto>) => {
    try {
      await api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Fehler");
    }
  };

  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Benutzerverwaltung</h1>
          <p className="opacity-60 text-sm mt-1">
            {users.length} Benutzer · {activeCount} aktiv
          </p>
        </div>
        <button className="btn btn-primary shadow-md" onClick={() => setShowCreate(true)}>
          <IconPlus className="w-4 h-4" /> Benutzer anlegen
        </button>
      </div>

      {users.length === 0 ? (
        <div className="card bg-base-100 border border-dashed border-base-300">
          <div className="card-body items-center text-center py-16">
            <span className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mb-2">
              <IconUsers className="w-8 h-8 opacity-40" />
            </span>
            <h3 className="font-bold text-lg">Noch keine Benutzer</h3>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-2xl shadow-sm border border-base-300">
          <table className="table">
            <thead className="bg-base-200/60 text-xs uppercase tracking-wider">
              <tr>
                <th>Benutzer</th>
                <th>Rolle</th>
                <th>Status</th>
                <th className="text-right">Aktiv</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`hover ${u.active ? "" : "opacity-50"}`}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} />
                      <div>
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-xs opacity-60">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="select select-bordered select-xs"
                      value={u.role}
                      onChange={(e) => update(u.id, { role: e.target.value as Role })}
                    >
                      {ROLES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`badge badge-sm ${u.active ? ROLE_BADGES[u.role] : "badge-ghost"}`}>
                      {u.active ? u.role : "deaktiviert"}
                    </span>
                  </td>
                  <td className="text-right">
                    <input
                      type="checkbox"
                      className="toggle toggle-sm toggle-success"
                      checked={u.active}
                      onChange={(e) => update(u.id, { active: e.target.checked })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <dialog open className="modal modal-open">
          <div className="modal-box rounded-2xl">
            <h3 className="font-bold text-xl">Neuen Benutzer anlegen</h3>
            <form onSubmit={create} className="space-y-4 mt-4">
              <label className="form-control">
                <span className="label-text font-medium pb-1">Name *</span>
                <input
                  className="input input-bordered w-full focus:input-primary"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="form-control">
                <span className="label-text font-medium pb-1">E-Mail *</span>
                <input
                  className="input input-bordered w-full focus:input-primary"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="form-control">
                <span className="label-text font-medium pb-1">Passwort * (min. 10 Zeichen)</span>
                <input
                  className="input input-bordered w-full focus:input-primary"
                  type="password"
                  required
                  minLength={10}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </label>
              <label className="form-control">
                <span className="label-text font-medium pb-1">Rolle</span>
                <select
                  className="select select-bordered w-full"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                >
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary">
                  <IconPlus className="w-4 h-4" /> Anlegen
                </button>
              </div>
            </form>
          </div>
          <button className="modal-backdrop" onClick={() => setShowCreate(false)} aria-label="Schließen" />
        </dialog>
      )}
    </div>
  );
}
