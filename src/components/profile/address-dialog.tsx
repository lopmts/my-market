"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client"; // ajuste para o seu client tRPC

export type AddressData = {
  id: string;
  name: string;
  cep: string;
  road: string;
  housenumber: string | null;
  observasion: string | null;
  isActive: boolean;
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const formatCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
};

const schema = z.object({
  name: z.string().trim().min(2, "Informe um nome para o endereço").max(60),
  cep: z.string().refine((v) => onlyDigits(v).length === 8, "CEP inválido"),
  road: z.string().trim().min(3, "Informe a rua").max(150),
  housenumber: z.string().trim().max(20, "Máximo de 20 caracteres"),
  observasion: z.string().trim().max(200, "Máximo de 200 caracteres"),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  name: "",
  cep: "",
  road: "",
  housenumber: "",
  observasion: "",
  isActive: false,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se informado, o formulário entra em modo edição. */
  address?: AddressData | null;
};

export function AddressDialog({ open, onOpenChange, address }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!address;

  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lookingUpCep, setLookingUpCep] = useState(false);

  const create = useMutation(trpc.address.create.mutationOptions());
  const update = useMutation(trpc.address.update.mutationOptions());
  const setActive = useMutation(trpc.address.setActive.mutationOptions());
  const remove = useMutation(trpc.address.delete.mutationOptions());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });
  const { reset } = form;

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    setConfirmDelete(false);
    reset(
      address
        ? {
            name: address.name,
            cep: formatCep(address.cep),
            road: address.road,
            housenumber: address.housenumber ?? "",
            observasion: address.observasion ?? "",
            isActive: address.isActive,
          }
        : emptyValues,
    );
  }, [open, address, reset]);

  const isBusy =
    form.formState.isSubmitting || remove.isPending || lookingUpCep;

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.address.list.queryKey() }),
      queryClient.invalidateQueries({
        queryKey: trpc.address.getActive.queryKey(),
      }),
    ]);
  };

  // Preenche a rua automaticamente pelo CEP (ViaCEP), sem sobrescrever o que já foi digitado
  const lookupCep = async (cep: string) => {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return;
    try {
      setLookingUpCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro && !form.getValues("road")) {
        const road = [data.logradouro, data.bairro].filter(Boolean).join(" - ");
        if (road) form.setValue("road", road, { shouldValidate: true });
      }
    } catch {
      // falha silenciosa: o usuário pode preencher a rua manualmente
    } finally {
      setLookingUpCep(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const payload = {
      name: values.name,
      cep: values.cep,
      road: values.road,
      housenumber: values.housenumber || null,
      observasion: values.observasion || null,
    };

    try {
      if (address) {
        await update.mutateAsync({ id: address.id, ...payload });
        // `update` não altera isActive; usa setActive quando necessário
        if (values.isActive && !address.isActive) {
          await setActive.mutateAsync({ id: address.id });
        }
      } else {
        await create.mutateAsync({ ...payload, isActive: values.isActive });
      }
      await refresh();
      onOpenChange(false);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o endereço.",
      );
    }
  };

  const onDelete = async () => {
    if (!address) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await remove.mutateAsync({ id: address.id });
      await refresh();
      onOpenChange(false);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o endereço.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar endereço" : "Novo endereço"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados do endereço de entrega."
              : "Cadastre um endereço para receber seus pedidos."}
          </DialogDescription>
        </DialogHeader>

        <form id="address-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="address-name">
                    Nome do endereço
                  </FieldLabel>
                  <Input
                    {...field}
                    id="address-name"
                    placeholder="Casa, Trabalho..."
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="cep"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="address-cep">CEP</FieldLabel>
                  <Input
                    {...field}
                    id="address-cep"
                    inputMode="numeric"
                    placeholder="00000-000"
                    autoComplete="postal-code"
                    aria-invalid={fieldState.invalid}
                    onChange={(e) => {
                      const masked = formatCep(e.target.value);
                      field.onChange(masked);
                      void lookupCep(masked);
                    }}
                  />
                  {lookingUpCep && (
                    <FieldDescription>Buscando endereço...</FieldDescription>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <Controller
                name="road"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="address-road">Rua</FieldLabel>
                    <Input
                      {...field}
                      id="address-road"
                      placeholder="Rua das Flores"
                      autoComplete="street-address"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="housenumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="address-number">Número</FieldLabel>
                    <Input
                      {...field}
                      id="address-number"
                      placeholder="123"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="observasion"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="address-obs">
                    Complemento / observação
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="address-obs"
                    rows={3}
                    placeholder="Apto, bloco, ponto de referência..."
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="address-active"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    disabled={address?.isActive}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="address-active">
                      Usar como endereço principal
                    </FieldLabel>
                    <FieldDescription>
                      O endereço principal é o usado nas entregas. O primeiro
                      endereço cadastrado já vira o principal.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            />

            {serverError && <FieldError>{serverError}</FieldError>}
          </FieldGroup>
        </form>

        <DialogFooter className="gap-2 sm:justify-between">
          {isEditing ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              disabled={isBusy}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              {confirmDelete ? "Confirmar exclusão" : "Excluir endereço"}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
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
              form="address-form"
              disabled={isBusy}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              {form.formState.isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Salvar endereço
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
