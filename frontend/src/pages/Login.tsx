import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store";

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">BesiDoc</h1>
          <p className="text-sm opacity-70">BaFin-Dokumentationsverwaltung – Anmeldung</p>
          <form onSubmit={submit} className="space-y-3 mt-2">
            <input
              type="email"
              required
              placeholder="E-Mail"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              placeholder="Passwort"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="alert alert-error text-sm py-2">{error}</div>}
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Anmelden"}
            </button>
          </form>
          <div className="text-xs opacity-60 mt-2">
            Demo-Zugänge: creator@ / fachpruefer@ / redaktion@ / admin@demo.besidoc.de
            <br />
            Passwort: BesiDoc2026!
          </div>
        </div>
      </div>
    </div>
  );
}
