import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("vendor"), // vendor, supplier, admin
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(), // kg, L, pieces, etc.
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  bulkDiscountThreshold: integer("bulk_discount_threshold").default(0),
  bulkDiscountPercentage: decimal("bulk_discount_percentage", { precision: 5, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: uuid("vendor_id").notNull().references(() => users.id),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, confirmed, processing, dispatched, delivered, cancelled
  deliveryAddress: text("delivery_address").notNull(),
  orderDate: timestamp("order_date").defaultNow(),
  deliveryDate: timestamp("delivery_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order Items table
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  discountApplied: decimal("discount_applied", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Supply Offers table
export const supplyOffers = pgTable("supply_offers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").notNull().references(() => users.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  availableQuantity: integer("available_quantity").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, accepted, rejected, fulfilled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Special Requests table
export const specialRequests = pgTable("special_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: uuid("vendor_id").notNull().references(() => users.id),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  budgetPerUnit: decimal("budget_per_unit", { precision: 10, scale: 2 }),
  urgency: varchar("urgency", { length: 20 }).notNull().default("normal"), // low, normal, high
  status: varchar("status", { length: 50 }).notNull().default("open"), // open, responded, fulfilled, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Special Request Responses table
export const specialRequestResponses = pgTable("special_request_responses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: uuid("request_id").notNull().references(() => specialRequests.id),
  supplierId: uuid("supplier_id").notNull().references(() => users.id),
  availableQuantity: integer("available_quantity").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Demand Aggregation table
export const dailyDemand = pgTable("daily_demand", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").notNull().references(() => products.id),
  date: timestamp("date").notNull(),
  totalDemand: integer("total_demand").notNull(),
  fulfilledQuantity: integer("fulfilled_quantity").default(0),
  remainingDemand: integer("remaining_demand").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  supplyOffers: many(supplyOffers),
  specialRequests: many(specialRequests),
  specialRequestResponses: many(specialRequestResponses),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  supplyOffers: many(supplyOffers),
  dailyDemand: many(dailyDemand),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  vendor: one(users, { fields: [orders.vendorId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const supplyOffersRelations = relations(supplyOffers, ({ one }) => ({
  supplier: one(users, { fields: [supplyOffers.supplierId], references: [users.id] }),
  product: one(products, { fields: [supplyOffers.productId], references: [products.id] }),
}));

export const specialRequestsRelations = relations(specialRequests, ({ one, many }) => ({
  vendor: one(users, { fields: [specialRequests.vendorId], references: [users.id] }),
  responses: many(specialRequestResponses),
}));

export const specialRequestResponsesRelations = relations(specialRequestResponses, ({ one }) => ({
  request: one(specialRequests, { fields: [specialRequestResponses.requestId], references: [specialRequests.id] }),
  supplier: one(users, { fields: [specialRequestResponses.supplierId], references: [users.id] }),
}));

export const dailyDemandRelations = relations(dailyDemand, ({ one }) => ({
  product: one(products, { fields: [dailyDemand.productId], references: [products.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertSupplyOfferSchema = createInsertSchema(supplyOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSpecialRequestSchema = createInsertSchema(specialRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSpecialRequestResponseSchema = createInsertSchema(specialRequestResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyDemandSchema = createInsertSchema(dailyDemand).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register schema
export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type SupplyOffer = typeof supplyOffers.$inferSelect;
export type InsertSupplyOffer = z.infer<typeof insertSupplyOfferSchema>;
export type SpecialRequest = typeof specialRequests.$inferSelect;
export type InsertSpecialRequest = z.infer<typeof insertSpecialRequestSchema>;
export type SpecialRequestResponse = typeof specialRequestResponses.$inferSelect;
export type InsertSpecialRequestResponse = z.infer<typeof insertSpecialRequestResponseSchema>;
export type DailyDemand = typeof dailyDemand.$inferSelect;
export type InsertDailyDemand = z.infer<typeof insertDailyDemandSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
