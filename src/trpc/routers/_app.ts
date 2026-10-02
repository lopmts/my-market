import { createTRPCRouter } from "../init";
import { aoddressRouter } from "./aoddress.routers";
import { categoryRouter } from "./categorys.routers";
import { orderItemRouter } from "./order-item.routers";
import { orderRouter } from "./order.routers";
import { productRouter } from "./products.routers";
import { reviewRouter } from "./review-routers";
import { userRouter } from "./user.routers";

export const appRouter = createTRPCRouter({
  user: userRouter,
  product: productRouter,
  category: categoryRouter,
  order: orderRouter,
  orderItem: orderItemRouter,
  review: reviewRouter,
  address: aoddressRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
