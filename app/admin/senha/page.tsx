import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MIN_PASSWORD_LENGTH, currentAdmin } from "@/lib/admin-auth";
import ChangePasswordForm from "./change-password-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Trocar senha · NewPay" };

export default async function ChangePassword() {
  if (!(await currentAdmin())) redirect("/admin/login");
  return <ChangePasswordForm minLength={MIN_PASSWORD_LENGTH} />;
}
