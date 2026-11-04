import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <header>
        <Link href="/" className="brand" aria-label="NewPay início">
          <span className="brand-symbol">n</span>new<span>pay</span>
          <span className="brand-divider" />
          <small>BLACK FRIDAY ’26</small>
        </Link>
        <Link className="admin-link" href="/">
          <ArrowUpRight size={15} />
          <span>Ver campanha</span>
        </Link>
      </header>
      <main className="auth-page">
        <section className="form-panel auth-panel">
          <div className="eyebrow">BASTIDORES DA BLACK</div>
          <h1>{title}</h1>
          <p>{description}</p>
          {children}
        </section>
      </main>
    </div>
  );
}
