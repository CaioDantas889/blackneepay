"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "../auth-shell";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        window.location.assign("/admin");
        return;
      }
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Não foi possível entrar. Tente novamente.");
      setPassword("");
    } catch {
      setError("Não foi possível entrar. Verifique sua conexão e tente novamente.");
    }
    setBusy(false);
  }

  return (
    <AuthShell title="Área restrita." description="Entre com seu e-mail e senha de administrador.">
      {error && <div className="error" role="alert">{error}</div>}
      <form onSubmit={submit}>
        <label>
          E-mail
          <input
            type="email"
            required
            autoFocus
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="primary full" disabled={busy}>
          {busy ? "Verificando…" : "Entrar"}
          <LockKeyhole size={16} />
        </button>
      </form>
    </AuthShell>
  );
}
