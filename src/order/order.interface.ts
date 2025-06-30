export type OrderCoursesMeta = {
  id: number;
  price?: number;
  months?: number;
  course: string;
  bundle?: string;
  bundleId?: number;
  bundlePrice?: number;
  discountedPrice?: number;
};
// export type OrderBundlesMeta = {
//   id: number;
//   price: number;
//   months?: number;
// };

export type OrderProductsMeta = {
  id: number;
  price: number;
  discountedPrice?: number;
};
export type OrderMeta = {
  courses: OrderCoursesMeta[];
  // bundles: OrderBundlesMeta[];
  products: OrderProductsMeta[];
};
