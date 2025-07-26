import { 
  users, products, orders, orderItems, supplyOffers, specialRequests, 
  specialRequestResponses, dailyDemand,
  type User, type InsertUser, type Product, type InsertProduct,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type SupplyOffer, type InsertSupplyOffer, type SpecialRequest, type InsertSpecialRequest,
  type SpecialRequestResponse, type InsertSpecialRequestResponse,
  type DailyDemand, type InsertDailyDemand
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sum, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]>;
  getOrdersByVendor(vendorId: string): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  getAllOrders(): Promise<(Order & { vendor: User; items: (OrderItem & { product: Product })[] })[]>;
  
  // Supply offer operations
  createSupplyOffer(offer: InsertSupplyOffer): Promise<SupplyOffer>;
  getSupplyOffersBySupplier(supplierId: string): Promise<SupplyOffer[]>;
  updateSupplyOffer(id: string, updates: Partial<InsertSupplyOffer>): Promise<SupplyOffer | undefined>;
  
  // Special request operations
  createSpecialRequest(request: InsertSpecialRequest): Promise<SpecialRequest>;
  getAllSpecialRequests(): Promise<(SpecialRequest & { vendor: User; responses: (SpecialRequestResponse & { supplier: User })[] })[]>;
  getSpecialRequestsByVendor(vendorId: string): Promise<SpecialRequest[]>;
  createSpecialRequestResponse(response: InsertSpecialRequestResponse): Promise<SpecialRequestResponse>;
  
  // Daily demand operations
  upsertDailyDemand(demand: InsertDailyDemand): Promise<DailyDemand>;
  getDailyDemandByDate(date: Date): Promise<(DailyDemand & { product: Product })[]>;
  updateDailyDemandFulfillment(productId: string, date: Date, fulfilledQuantity: number): Promise<void>;
  
  // Analytics operations
  getVendorStats(vendorId: string): Promise<{ totalOrders: number; totalSpent: number; ordersThisMonth: number }>;
  getSupplierStats(supplierId: string): Promise<{ totalSupplies: number; revenue: number; fulfillmentRate: number }>;
  getAdminStats(): Promise<{ 
    totalVendors: number; 
    totalSuppliers: number; 
    totalOrders: number; 
    ordersToday: number;
    revenueToday: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...userData, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.name));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  // Order operations
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    return await db.insert(orderItems).values(items).returning();
  }

  async getOrdersByVendor(vendorId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.vendorId, vendorId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getAllOrders(): Promise<(Order & { vendor: User; items: (OrderItem & { product: Product })[] })[]> {
    const ordersWithDetails = await db
      .select({
        order: orders,
        vendor: users,
      })
      .from(orders)
      .leftJoin(users, eq(orders.vendorId, users.id))
      .orderBy(desc(orders.createdAt));

    const result = [];
    for (const { order, vendor } of ordersWithDetails) {
      const items = await db
        .select({
          orderItem: orderItems,
          product: products,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      result.push({
        ...order,
        vendor: vendor!,
        items: items.map(({ orderItem, product }) => ({ ...orderItem, product: product! })),
      });
    }
    return result;
  }

  // Supply offer operations
  async createSupplyOffer(offerData: InsertSupplyOffer): Promise<SupplyOffer> {
    const [offer] = await db.insert(supplyOffers).values(offerData).returning();
    return offer;
  }

  async getSupplyOffersBySupplier(supplierId: string): Promise<SupplyOffer[]> {
    return await db
      .select()
      .from(supplyOffers)
      .where(eq(supplyOffers.supplierId, supplierId))
      .orderBy(desc(supplyOffers.createdAt));
  }

  async updateSupplyOffer(id: string, updates: Partial<InsertSupplyOffer>): Promise<SupplyOffer | undefined> {
    const [offer] = await db
      .update(supplyOffers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supplyOffers.id, id))
      .returning();
    return offer;
  }

  // Special request operations
  async createSpecialRequest(requestData: InsertSpecialRequest): Promise<SpecialRequest> {
    const [request] = await db.insert(specialRequests).values(requestData).returning();
    return request;
  }

  async getAllSpecialRequests(): Promise<(SpecialRequest & { vendor: User; responses: (SpecialRequestResponse & { supplier: User })[] })[]> {
    const requestsWithVendors = await db
      .select({
        request: specialRequests,
        vendor: users,
      })
      .from(specialRequests)
      .leftJoin(users, eq(specialRequests.vendorId, users.id))
      .orderBy(desc(specialRequests.createdAt));

    const result = [];
    for (const { request, vendor } of requestsWithVendors) {
      const responses = await db
        .select({
          response: specialRequestResponses,
          supplier: users,
        })
        .from(specialRequestResponses)
        .leftJoin(users, eq(specialRequestResponses.supplierId, users.id))
        .where(eq(specialRequestResponses.requestId, request.id));

      result.push({
        ...request,
        vendor: vendor!,
        responses: responses.map(({ response, supplier }) => ({ ...response, supplier: supplier! })),
      });
    }
    return result;
  }

  async getSpecialRequestsByVendor(vendorId: string): Promise<SpecialRequest[]> {
    return await db
      .select()
      .from(specialRequests)
      .where(eq(specialRequests.vendorId, vendorId))
      .orderBy(desc(specialRequests.createdAt));
  }

  async createSpecialRequestResponse(responseData: InsertSpecialRequestResponse): Promise<SpecialRequestResponse> {
    const [response] = await db.insert(specialRequestResponses).values(responseData).returning();
    return response;
  }

  // Daily demand operations
  async upsertDailyDemand(demandData: InsertDailyDemand): Promise<DailyDemand> {
    const [demand] = await db
      .insert(dailyDemand)
      .values(demandData)
      .onConflictDoUpdate({
        target: [dailyDemand.productId, dailyDemand.date],
        set: {
          totalDemand: demandData.totalDemand,
          remainingDemand: demandData.remainingDemand,
          updatedAt: new Date(),
        },
      })
      .returning();
    return demand;
  }

  async getDailyDemandByDate(date: Date): Promise<(DailyDemand & { product: Product })[]> {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const demands = await db
      .select({
        demand: dailyDemand,
        product: products,
      })
      .from(dailyDemand)
      .leftJoin(products, eq(dailyDemand.productId, products.id))
      .where(and(
        sql`${dailyDemand.date} >= ${dateStart}`,
        sql`${dailyDemand.date} <= ${dateEnd}`
      ));

    return demands.map(({ demand, product }) => ({ ...demand, product: product! }));
  }

  async updateDailyDemandFulfillment(productId: string, date: Date, fulfilledQuantity: number): Promise<void> {
    await db
      .update(dailyDemand)
      .set({
        fulfilledQuantity,
        remainingDemand: sql`${dailyDemand.totalDemand} - ${fulfilledQuantity}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(dailyDemand.productId, productId),
        eq(dailyDemand.date, date)
      ));
  }

  // Analytics operations
  async getVendorStats(vendorId: string): Promise<{ totalOrders: number; totalSpent: number; ordersThisMonth: number }> {
    const totalOrders = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.vendorId, vendorId));

    const totalSpent = await db
      .select({ sum: sql<number>`sum(${orders.totalAmount})` })
      .from(orders)
      .where(eq(orders.vendorId, vendorId));

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const ordersThisMonth = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.vendorId, vendorId),
        sql`${orders.createdAt} >= ${thisMonth}`
      ));

    return {
      totalOrders: totalOrders[0]?.count || 0,
      totalSpent: Number(totalSpent[0]?.sum || 0),
      ordersThisMonth: ordersThisMonth[0]?.count || 0,
    };
  }

  async getSupplierStats(supplierId: string): Promise<{ totalSupplies: number; revenue: number; fulfillmentRate: number }> {
    const totalSupplies = await db
      .select({ count: sql<number>`count(*)` })
      .from(supplyOffers)
      .where(eq(supplyOffers.supplierId, supplierId));

    const revenue = await db
      .select({ sum: sql<number>`sum(${supplyOffers.availableQuantity} * ${supplyOffers.pricePerUnit})` })
      .from(supplyOffers)
      .where(and(
        eq(supplyOffers.supplierId, supplierId),
        eq(supplyOffers.status, "fulfilled")
      ));

    const fulfilledSupplies = await db
      .select({ count: sql<number>`count(*)` })
      .from(supplyOffers)
      .where(and(
        eq(supplyOffers.supplierId, supplierId),
        eq(supplyOffers.status, "fulfilled")
      ));

    const fulfillmentRate = totalSupplies[0]?.count 
      ? (fulfilledSupplies[0]?.count || 0) / totalSupplies[0].count * 100 
      : 0;

    return {
      totalSupplies: totalSupplies[0]?.count || 0,
      revenue: Number(revenue[0]?.sum || 0),
      fulfillmentRate: Math.round(fulfillmentRate),
    };
  }

  async getAdminStats(): Promise<{ 
    totalVendors: number; 
    totalSuppliers: number; 
    totalOrders: number; 
    ordersToday: number;
    revenueToday: number;
  }> {
    const totalVendors = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "vendor"));

    const totalSuppliers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "supplier"));

    const totalOrders = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ordersToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${today}`,
        sql`${orders.createdAt} < ${tomorrow}`
      ));

    const revenueToday = await db
      .select({ sum: sql<number>`sum(${orders.totalAmount})` })
      .from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${today}`,
        sql`${orders.createdAt} < ${tomorrow}`
      ));

    return {
      totalVendors: totalVendors[0]?.count || 0,
      totalSuppliers: totalSuppliers[0]?.count || 0,
      totalOrders: totalOrders[0]?.count || 0,
      ordersToday: ordersToday[0]?.count || 0,
      revenueToday: Number(revenueToday[0]?.sum || 0),
    };
  }
}

export const storage = new DatabaseStorage();
