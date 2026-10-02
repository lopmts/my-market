import type { Metadata } from "next";
import { AuthForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar ou criar conta | My Market",
  description: "Acesse sua conta My Market ou crie uma conta para fazer pedidos.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <AuthForm />;
}
