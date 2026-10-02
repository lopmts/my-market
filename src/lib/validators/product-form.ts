import { z } from "zod";

export const MAX_GALLERY_IMAGES = 8;

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Mínimo de 2 caracteres").max(80, "Máximo de 80 caracteres"),
  description: z.string().max(500, "Máximo de 500 caracteres"),
  // texto no input (aceita "29,90" ou "29.90"); convertido para number no submit
  price: z
    .string()
    .trim()
    .regex(/^\d+([.,]\d{1,2})?$/, "Informe um valor válido, ex: 29,90")
    .refine((v) => parseFloat(v.replace(",", ".")) > 0, "O preço deve ser maior que zero"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  image: z.union([z.literal(""), z.string().url("URL inválida")]),
  images: z
    .array(z.object({ url: z.string().url("URL inválida") }))
    .max(MAX_GALLERY_IMAGES, `Máximo de ${MAX_GALLERY_IMAGES} imagens`),
  active: z.boolean(),
  featured: z.boolean(),
  isPromotion: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

// formato mínimo que o form precisa para editar (compatível com o retorno do tRPC)
export type ProductFormSource = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  images: string[];
  price: number;
  active: boolean;
  featured: boolean;
  isPromotion: boolean;
  categoryId: string;
};

export const emptyProductValues: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  image: "",
  images: [],
  active: true,
  featured: false,
  isPromotion: false,
};

export const productToFormValues = (p: ProductFormSource): ProductFormValues => ({
  name: p.name,
  description: p.description ?? "",
  price: p.price.toFixed(2).replace(".", ","),
  categoryId: p.categoryId,
  image: p.image ?? "",
  images: p.images.map((url) => ({ url })),
  active: p.active,
  featured: p.featured,
  isPromotion: p.isPromotion,
});

// valores do form -> input do productRouter (create / update.data)
export const formValuesToPayload = (v: ProductFormValues) => ({
  name: v.name.trim(),
  description: v.description.trim() || null,
  image: v.image || null,
  images: v.images.map((i) => i.url),
  price: Number(parseFloat(v.price.replace(",", ".")).toFixed(2)),
  active: v.active,
  featured: v.featured,
  isPromotion: v.isPromotion,
  categoryId: v.categoryId,
});
