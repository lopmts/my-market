"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Props = {
  isEditing: boolean;
  isPending: boolean;
  onCancel: () => void;
};

// barra fixa no rodapé: sempre ao alcance do polegar no mobile
export function ProductFormActions({ isEditing, isPending, onCancel }: Props) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex gap-3 border-t bg-background/95 p-4 backdrop-blur md:-mx-6 md:justify-end md:px-6">
      <Button
        type="button"
        variant="outline"
        className="flex-1 md:flex-none"
        onClick={onCancel}
        disabled={isPending}
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        className="flex-1 md:flex-none"
        disabled={isPending}
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {isEditing ? "Salvar alterações" : "Criar produto"}
      </Button>
    </div>
  );
}
