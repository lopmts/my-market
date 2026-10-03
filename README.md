This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## SEO

O projeto gera `/sitemap.xml` dinamicamente com as páginas públicas e os
produtos ativos. O arquivo `/robots.txt` informa o sitemap e impede a indexação
de rotas de conta, pedidos, pagamentos e API.

Configure `NEXT_PUBLIC_SITE_URL` com a URL canônica do site em produção. Se ela
não estiver definida, o projeto usa `APP_URL`, as variáveis de domínio da
Vercel ou `http://localhost:3000`, nessa ordem.

Os pagamentos do Mercado Pago exigem que `APP_URL` (ou
`NEXT_PUBLIC_SITE_URL`) aponte para uma URL pública HTTPS para que o webhook
seja válido e possa receber notificações. Em desenvolvimento local, use um
túnel HTTPS (por exemplo, ngrok ou Cloudflare Tunnel) apontado para a porta
3000 e defina `APP_URL` para a URL HTTPS gerada; reinicie o servidor após
alterar o `.env`. URLs `localhost` não podem receber notificações do Mercado
Pago e o endpoint de pagamento retorna uma mensagem de configuração em vez de
enviar uma URL inválida.

## Pedidos e pagamentos

O carrinho consulta `order.quote` para exibir preços atuais, e a criação do
pedido calcula novamente subtotal e total no servidor usando os preços do
banco. Os endpoints PIX e cartão validam os valores persistidos antes de
solicitar a cobrança ao Mercado Pago; alterações nos itens são bloqueadas
enquanto houver um pagamento pendente ou confirmado.

## Administração de produtos

O catálogo administrativo fica em `/admin/produtos`, com busca, filtros,
paginação, edição, ativação/desativação e exclusão confirmada. Produtos
associados a itens de pedidos não podem ser excluídos; nesses casos, desative o
produto para mantê-lo fora do cardápio sem perder o histórico.

## Painel administrativo

A rota `/admin` exibe indicadores dos últimos sete dias, faturamento de
pagamentos confirmados, novos clientes, unidades vendidas, distribuição dos
pedidos por status, pedidos recentes e produtos mais vendidos. Os dados vêm
da rota protegida `admin.dashboard` e são atualizados automaticamente a cada
minuto.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
