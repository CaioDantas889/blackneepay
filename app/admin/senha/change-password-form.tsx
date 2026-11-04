"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { AuthShell } from "../auth-shell";

export default function ChangePasswordForm({ minLength }: { minLength: number }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      const body = (await response.json()) as { error?: string };
      if (response.ok) setDone(true);
      else setError(body.error ?? "Não foi possível trocar a senha. Tente novamente.");
    } catch {
      setError("Não foi possível trocar a senha. Verifique sua conexão e tente novamente.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <AuthShell title="Senha alterada." description="Use a nova senha no próximo login. Outros dispositivos conectados foram desconectados.">
        <a className="primary full auth-action" href="/admin">
          Voltar para a gestão <ArrowRight size={16} />
        </a>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Trocar senha." description="Confirme a senha atual e escolha uma nova.">
      {error && <div className="error" role="alert">{error}</div>}
      <form onSubmit={submit}>
        <label>
          Senha atual
          <input
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label>
          Nova senha <span>(mínimo de {minLength} caracteres)</span>
          <input
            type="password"
            required
            minLength={minLength}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        <label>
          Confirmar nova senha
          <input
            type="password"
            required
            minLength={minLength}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
        <button className="primary full" disabled={busy}>
          {busy ? "Salvando…" : "Salvar nova senha"}
          <Check size={16} />
        </button>
      </form>
      <a className="text-link auth-back" href="/admin">Voltar para a gestão</a>
    </AuthShell>
  );
}
