import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store";
import { IconCheckCircle, IconShield } from "../components/icons";

const FEATURES = [
  "19 BesiDoc-Module mit fachlicher Validierung",
  "Mehrstufiger Genehmigungsworkflow mit Audit-Trail",
  "Versionierung, Review-Kommentare & PDF-Export",
];

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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero-Seite */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-primary to-secondary text-primary-content p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-[28rem] h-[28rem] rounded-full bg-white/5" />

        <div className="flex items-center gap-3 relative">
          <span className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <IconShield className="w-7 h-7" />
          </span>
          <div>
            <p className="text-2xl font-extrabold tracking-tight">BesiDoc</p>
            <p className="text-xs uppercase tracking-[0.2em] opacity-75">BaFin-Dokumentation</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">
            IT-Systeme dokumentieren.
            <br />
            <span className="opacity-80">Revisionssicher. Konform.</span>
          </h1>
          <p className="mt-4 opacity-80">
            Der vollständige Dokumentlebenszyklus für FinanzIT-Unternehmen — von der Erstellung über
            fachliche und redaktionelle Abnahme bis zur genehmigten, exportierbaren Dokumentation.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <IconCheckCircle className="w-5 h-5 shrink-0 opacity-90" />
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs opacity-60 relative">© 2026 BesiDoc · Demo-Umgebung</p>
      </div>

      {/* Formular-Seite */}
      <div className="flex items-center justify-center bg-base-200 p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <span className="w-11 h-11 rounded-2xl bg-primary text-primary-content flex items-center justify-center">
              <IconShield className="w-6 h-6" />
            </span>
            <div>
              <p className="text-xl font-extrabold">BesiDoc</p>
              <p className="text-[10px] uppercase tracking-widest opacity-60">BaFin-Dokumentation</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body p-8">
              <h2 className="text-2xl font-bold">Willkommen zurück</h2>
              <p className="text-sm opacity-60 mb-2">Melden Sie sich mit Ihrem Konto an.</p>

              <form onSubmit={submit} className="space-y-4">
                <label className="form-control">
                  <span className="label-text font-medium pb-1">E-Mail</span>
                  <input
                    type="email"
                    required
                    placeholder="name@unternehmen.de"
                    className="input input-bordered w-full focus:input-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="form-control">
                  <span className="label-text font-medium pb-1">Passwort</span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••"
                    className="input input-bordered w-full focus:input-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                {error && (
                  <div className="alert alert-error text-sm py-2.5">
                    <span>{error}</span>
                  </div>
                )}
                <button className="btn btn-primary w-full text-base" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : "Anmelden"}
                </button>
              </form>
            </div>
          </div>

          <div className="collapse collapse-arrow bg-base-100 border border-base-300 mt-4 rounded-2xl">
            <input type="checkbox" />
            <div className="collapse-title text-sm font-medium opacity-70">Demo-Zugänge anzeigen</div>
            <div className="collapse-content text-xs space-y-1">
              {[
                ["Creator", "creator@demo.besidoc.de"],
                ["Fachprüfung", "fachpruefer@demo.besidoc.de"],
                ["Redaktion", "redaktion@demo.besidoc.de"],
                ["Admin", "admin@demo.besidoc.de"],
              ].map(([role, mail]) => (
                <button
                  key={mail}
                  type="button"
                  className="flex w-full justify-between p-2 rounded-lg hover:bg-base-200 transition-colors"
                  onClick={() => {
                    setEmail(mail);
                    setPassword("BesiDoc2026!");
                  }}
                >
                  <span className="badge badge-ghost badge-sm">{role}</span>
                  <code>{mail}</code>
                </button>
              ))}
              <p className="opacity-60 pt-1">
                Passwort jeweils <code>BesiDoc2026!</code> — Klick übernimmt die Zugangsdaten.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
