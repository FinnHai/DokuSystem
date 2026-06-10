import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api";
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

export default function AdminUsers() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "CREATOR" as Role });
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>

      <form onSubmit={create} className="card bg-base-100 shadow p-4 flex flex-wrap gap-2 items-end flex-row">
        <input className="input input-bordered input-sm" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input input-bordered input-sm" type="email" placeholder="E-Mail" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input input-bordered input-sm" type="password" placeholder="Passwort (min. 10)" required minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="select select-bordered select-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm">+ Anlegen</button>
      </form>

      <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Aktiv</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
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
    </div>
  );
}
