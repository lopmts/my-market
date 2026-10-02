"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCartItems,
  useCartStore,
  useCartSubtotal,
  useCartTotalItems,
} from "@/store/cart-store";
import { formatPrice } from "@/utils/price-format";
import { ImageOff, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const CartDropdown = () => {
  const items = useCartItems();
  const totalItems = useCartTotalItems();
  const subtotal = useCartSubtotal();

  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);

  const isEmpty = items.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="relative">
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-semibold text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Button>
        }
      />

      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Meu carrinho</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {isEmpty ? (
          <div className="flex flex-col items-center gap-2 px-2 py-6 text-center">
            <ShoppingCart size={28} className="text-zinc-400" />
            <p className="text-sm text-zinc-400">Seu carrinho está vazio</p>
          </div>
        ) : (
          <>
            {/* divs em vez de DropdownMenuItem: os itens têm controles
                interativos aninhados (+/-, remover), o que não é seguro
                dentro de um elemento com role="menuitem" */}
            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto px-1 py-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-md p-1.5"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-800/50">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageOff size={16} />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="line-clamp-1 text-sm font-medium">
                      {item.name}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {formatPrice(item.price)} un.
                    </span>

                    <div className="mt-1 flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => decrement(item.id)}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                      >
                        <Minus size={12} />
                      </Button>

                      <span className="w-4 text-center text-sm">
                        {item.quantity}
                      </span>

                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => increment(item.id)}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                      >
                        <Plus size={12} />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="ml-auto h-6 w-6 text-red-500 hover:text-red-600"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remover ${item.name} do carrinho`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <DropdownMenuSeparator />

            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm text-zinc-400">Subtotal</span>
              <span className="text-base font-semibold">
                {formatPrice(subtotal)}
              </span>
            </div>

            <div className="p-2 pt-0">
              <Button
                render={<Link href="/carrinho" />}
                className="w-full bg-amber-500 dark:text-white"
              >
                Finalizar pedido
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CartDropdown;
