import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar · NewPay" };

export default async function AdminLogin() {
  if (await currentAdmin()) redirect("/admin");
  return <LoginForm />;
}
