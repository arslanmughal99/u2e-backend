import { StoreOrderStatus } from '@prisma/client';

export type CreateStoreOrderProduct = {
  productId: number;
  discountedAmount?: number;
};

export type CreateStoreOrder = {
  amount: number;
  userId: number;
  status: StoreOrderStatus;
  products: CreateStoreOrderProduct[];
};
