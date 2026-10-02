"use client";

import { KeyRound, Loader, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";
type Step = "email" | "code";

const RESEND_COOLDOWN_SECONDS = 30;

export function AuthForm() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("login");
  const [step, setStep] = useState<Step>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function switchTab(next: Tab) {
    setTab(next);
    setStep("email");
    setCode("");
    setError(null);
  }

  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // TODO: se o cadastro exigir salvar o "name" antes do OTP, chame aqui
    // uma rota própria (ex: trpc.user.register) passando { name, email }.
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Não foi possível enviar o código.");
      return;
    }

    setStep("code");
    startCooldown();
  }

  async function handleResendCode() {
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Não foi possível reenviar o código.");
      return;
    }
    startCooldown();
  }

  async function handleVerifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authClient.signIn.emailOtp({ email, otp: code });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Código inválido ou expirado.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleGoogle() {
    setLoadingGoogle(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
      newUserCallbackURL: "/",
    });
    setLoadingGoogle(false);
  }

  return (
    <div className="space-y-6">
      {/* Topo: logo + link de troca de aba */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-lg">
            🍔
          </span>
          <div>
            <p className="text-base font-bold leading-tight">
              Sabor<span className="text-orange-500">Top</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Sabor em cada momento
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => switchTab(tab === "login" ? "register" : "login")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {tab === "login" ? (
            <>
              Não tem conta?{" "}
              <span className="font-semibold text-orange-500">
                Cadastre-se →
              </span>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <span className="font-semibold text-orange-500">Entrar →</span>
            </>
          )}
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {tab === "login" ? "Acesse sua conta" : "Crie sua conta"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === "email"
            ? "Entre com seu e-mail ou cadastre-se para fazer seu pedido."
            : `Enviamos um código para ${email}`}
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 rounded-lg border p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => switchTab("login")}
          className={cn(
            "rounded-md py-2 transition-colors",
            tab === "login"
              ? "bg-orange-500 text-white"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => switchTab("register")}
          className={cn(
            "rounded-md py-2 transition-colors",
            tab === "register"
              ? "bg-orange-500 text-white"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Cadastrar
        </button>
      </div>

      {/* Passo 1: e-mail (+ nome no cadastro) */}
      {step === "email" && (
        <form onSubmit={handleSendCode} className="space-y-4">
          {tab === "register" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite seu nome"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">E-mail</label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                required
                className="pl-9"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            disabled={loading}
            type="submit"
            className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
          >
            {loading && <Loader size={16} className="animate-spin" />}
            {tab === "login" ? "Entrar" : "Criar conta"}
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            ou continue com
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              disabled={loadingGoogle}
              className="gap-2"
            >
              {loadingGoogle ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                "🇬"
              )}
              Google
            </Button>
            {/* TODO: habilitar quando os providers Apple/Facebook estiverem
                configurados no better-auth */}
            <Button type="button" variant="outline" disabled className="gap-2">
              Apple
            </Button>
            <Button type="button" variant="outline" disabled className="gap-2">
              Facebook
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Ao continuar, você concorda com nossos{" "}
            <a href="/termos" className="text-orange-500 hover:underline">
              Termos de Uso
            </a>{" "}
            e{" "}
            <a href="/privacidade" className="text-orange-500 hover:underline">
              Política de Privacidade
            </a>
            .
          </p>
        </form>
      )}

      {/* Passo 2: código */}
      {step === "code" && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Código de 6 dígitos</label>
            <div className="relative">
              <KeyRound
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
                className="pl-9 text-center tracking-widest"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
          >
            {loading && <Loader size={16} className="animate-spin" />}
            Confirmar
          </Button>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-muted-foreground hover:text-foreground underline"
            >
              Usar outro e-mail
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={cooldown > 0 || loading}
              className="text-orange-500 hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {cooldown > 0 ? `Reenviar (${cooldown}s)` : "Reenviar código"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
