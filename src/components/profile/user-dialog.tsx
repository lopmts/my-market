"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client"; // ajuste para o seu client tRPC

const isUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome")
    .max(80, "Máximo de 80 caracteres"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  image: z
    .string()
    .trim()
    .refine((v) => v === "" || isUrl(v), "Informe uma URL válida"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { name: string; email: string; image: string | null };
  /** Telefone fake (ainda não existe no banco): exibido, mas não editável. */
  phone: string;
};

export function UserEditeProfile({ open, onOpenChange, user, phone }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"form" | "code">("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const updateProfile = useMutation(trpc.user.updateProfile.mutationOptions());
  const requestEmailChange = useMutation(
    trpc.user.requestEmailChange.mutationOptions(),
  );
  const confirmEmailChange = useMutation(
    trpc.user.confirmEmailChange.mutationOptions(),
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", image: "" },
  });
  const { reset } = form;

  // Reinicia os dados no evento de abertura, evitando atualizações síncronas no effect.
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !open) {
      setStep("form");
      setPendingEmail("");
      setCode("");
      setCooldown(0);
      setServerError(null);
      reset({ name: user.name, email: user.email, image: user.image ?? "" });
    }
    onOpenChange(nextOpen);
  };

  // Contagem regressiva do "Reenviar código"
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(
      () => setCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [cooldown]);

  const refreshMe = () =>
    queryClient.invalidateQueries({ queryKey: trpc.user.me.queryKey() });

  const sendCode = async (email: string) => {
    const result = await requestEmailChange.mutateAsync({ newEmail: email });
    setPendingEmail(email);
    setCooldown(result.resendInSeconds);
    setCode("");
    setStep("code");
  };

  const errorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  /* Passo 1: salva nome/foto e, se o e-mail mudou, envia o código */
  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const nameChanged = values.name !== user.name;
      const imageChanged = (values.image || null) !== (user.image ?? null);

      if (nameChanged || imageChanged) {
        await updateProfile.mutateAsync({
          name: values.name,
          image: values.image || null,
        });
        await refreshMe();
      }

      if (values.email !== user.email.toLowerCase()) {
        await sendCode(values.email);
        return;
      }

      onOpenChange(false);
    } catch (error) {
      setServerError(
        errorMessage(error, "Não foi possível salvar as alterações."),
      );
    }
  };

  /* Passo 2: confere o código */
  const onConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setServerError(null);
    setIsVerifying(true);
    try {
      await confirmEmailChange.mutateAsync({ newEmail: pendingEmail, code });
      await refreshMe();
      onOpenChange(false);
    } catch (error) {
      setServerError(
        errorMessage(error, "Não foi possível confirmar o código."),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const onResend = async () => {
    setServerError(null);
    try {
      await sendCode(pendingEmail);
    } catch (error) {
      setServerError(
        errorMessage(error, "Não foi possível reenviar o código."),
      );
    }
  };

  const isBusy =
    form.formState.isSubmitting || isVerifying || requestEmailChange.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Editar perfil</DialogTitle>
              <DialogDescription>
                Atualize seus dados pessoais.
              </DialogDescription>
            </DialogHeader>

            <form id="user-form" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="user-name">Nome</FieldLabel>
                      <Input
                        {...field}
                        id="user-name"
                        autoComplete="name"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="user-email">E-mail</FieldLabel>
                      <Input
                        {...field}
                        id="user-email"
                        type="email"
                        autoComplete="email"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>
                        Ao trocar o e-mail, enviaremos um código de 6 dígitos
                        para o novo endereço.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Field>
                  <FieldLabel htmlFor="user-phone">Telefone</FieldLabel>
                  <Input id="user-phone" value={phone} disabled readOnly />
                  <FieldDescription>
                    Em breve você poderá editar seu telefone.
                  </FieldDescription>
                </Field>

                <Controller
                  name="image"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="user-image">Foto (URL)</FieldLabel>
                      <Input
                        {...field}
                        id="user-image"
                        inputMode="url"
                        placeholder="https://..."
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>
                        Deixe em branco para usar a inicial do nome.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {serverError && <FieldError>{serverError}</FieldError>}
              </FieldGroup>
            </form>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isBusy}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="user-form"
                disabled={isBusy}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                {isBusy && <Loader2 className="size-4 animate-spin" />}
                Salvar alterações
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirme seu novo e-mail</DialogTitle>
              <DialogDescription>
                Enviamos um código de 6 dígitos para{" "}
                <strong>{pendingEmail}</strong>. Ele expira em 10 minutos.
              </DialogDescription>
            </DialogHeader>

            <form id="email-code-form" onSubmit={onConfirmCode}>
              <FieldGroup>
                <Field data-invalid={!!serverError}>
                  <FieldLabel htmlFor="email-code">
                    Código de verificação
                  </FieldLabel>
                  <Input
                    id="email-code"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    aria-invalid={!!serverError}
                    className="text-center text-2xl font-semibold tracking-[0.5em]"
                  />
                  {serverError && <FieldError>{serverError}</FieldError>}
                  <FieldDescription>
                    Não recebeu? Confira a caixa de spam ou reenvie o código.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>

            <DialogFooter className="gap-2 sm:justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setServerError(null);
                    setStep("form");
                  }}
                  disabled={isBusy}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onResend}
                  disabled={isBusy || cooldown > 0}
                  className="text-orange-600 hover:text-orange-700 dark:text-orange-400"
                >
                  {cooldown > 0
                    ? `Reenviar em ${cooldown}s`
                    : "Reenviar código"}
                </Button>
              </div>
              <Button
                type="submit"
                form="email-code-form"
                disabled={isBusy || code.length !== 6}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                {isVerifying && <Loader2 className="size-4 animate-spin" />}
                Confirmar e-mail
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
