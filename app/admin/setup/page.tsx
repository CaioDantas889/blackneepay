"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { AuthShell } from "../auth-shell";

const MIN_PASSWORD_LENGTH = 12;

export default function AdminSetup() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email, password }),
      });
      const body = (await response.json()) as { error?: string };
      if (response.ok) setDone(true);
      else setError(body.error ?? "Não foi possível salvar o acesso. Tente novamente.");
    } catch {
      setError("Não foi possível salvar o acesso. Verifique sua conexão e tente novamente.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <AuthShell title="Acesso configurado." description="O código foi utilizado e não vale mais. Use seu e-mail e senha para entrar.">
        <a className="primary full auth-action" href="/admin/login">
          Ir para o login <ArrowRight size={16} />
        </a>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Configurar acesso." description="Use o código gerado no terminal para criar um administrador ou trocar a senha de um existente.">
      {error && <div className="error" role="alert">{error}</div>}
      <form onSubmit={submit}>
        <label>
          Código de configuração
          <input
            required
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Senha <span>(mínimo de {MIN_PASSWORD_LENGTH} caracteres)</span>
          <input
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          Confirmar senha
          <input
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
        <button className="primary full" disabled={busy}>
          {busy ? "Salvando…" : "Salvar acesso"}
          <Check size={16} />
        </button>
      </form>
    </AuthShell>
  );
}
