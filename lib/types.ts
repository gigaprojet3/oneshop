import type { Currency, OrderSource, OrderStatus, PlanId } from "./domain";

export type Shop = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  country: string;
  currency: Currency;
  city: string;
  phone: string;
  email: string | null;
  description: string | null;
  default_delivery_fee: number;
  /** Thème brut tel qu'enregistré : toujours le passer par normalizeTheme (lib/theme/schema.ts). */
  theme: unknown;
  created_at: string;
};

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export type Subscription = {
  id: string;
  shop_id: string;
  plan: PlanId;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string;
  cancel_at_period_end: boolean;
  provider: string;
  provider_customer_id: string | null;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  /** Prix « avant », barré à côté du prix de vente. */
  compare_at_price: number | null;
  stock: number;
  image_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
};

export type Order = {
  id: string;
  shop_id: string;
  number: number;
  status: OrderStatus;
  source: OrderSource;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  city: string;
  district: string | null;
  landmark: string | null;
  note: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  public_token: string;
  created_at: string;
  updated_at: string;
};

export type OrderWithItems = Order & { order_items: OrderItem[] };

/** Ce que la boutique en ligne expose publiquement. */
export type StorefrontShop = Pick<
  Shop,
  "id" | "name" | "slug" | "description" | "city" | "country" | "currency" | "phone" | "email" | "default_delivery_fee"
>;

export type StorefrontProduct = Pick<
  Product,
  "id" | "name" | "description" | "price" | "compare_at_price" | "stock" | "image_path"
>;

/** État renvoyé par les Server Actions aux formulaires. */
export type FormState = {
  error?: string;
  fields?: Record<string, string>;
  ok?: boolean;
} | null;
