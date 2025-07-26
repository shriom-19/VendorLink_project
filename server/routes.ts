import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginSchema, registerSchema, insertOrderSchema, insertOrderItemSchema, insertSupplyOfferSchema, insertSpecialRequestSchema, insertSpecialRequestResponseSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware to check user role
const requireRole = (roles: string[]) => {
  return (req: any, res: Response, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { confirmPassword, ...userData } = validatedData;
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      const user = await storage.createUser(userData);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        user: { ...user, password: undefined },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        user: { ...user, password: undefined },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res: Response) => {
    res.json({ ...req.user, password: undefined });
  });

  // Product routes
  app.get('/api/products', async (req: Request, res: Response) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/products', authenticateToken, requireRole(['admin']), async (req: any, res: Response) => {
    try {
      const productData = req.body;
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/products/:id', authenticateToken, requireRole(['admin']), async (req: any, res: Response) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', authenticateToken, requireRole(['admin']), async (req: any, res: Response) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });

  // Order routes
  app.post('/api/orders', authenticateToken, requireRole(['vendor']), async (req: any, res: Response) => {
    try {
      const { items, ...orderData } = req.body;
      orderData.vendorId = req.user.id;
      
      const order = await storage.createOrder(orderData);
      
      const orderItems = items.map((item: any) => ({
        ...item,
        orderId: order.id
      }));
      
      await storage.createOrderItems(orderItems);
      
      res.json(order);
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/orders', authenticateToken, async (req: any, res: Response) => {
    try {
      if (req.user.role === 'vendor') {
        const orders = await storage.getOrdersByVendor(req.user.id);
        res.json(orders);
      } else if (req.user.role === 'admin') {
        const orders = await storage.getAllOrders();
        res.json(orders);
      } else {
        res.status(403).json({ message: 'Insufficient permissions' });
      }
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/orders/:id/status', authenticateToken, requireRole(['admin']), async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json(order);
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Supply offer routes
  app.post('/api/supply-offers', authenticateToken, requireRole(['supplier']), async (req: any, res: Response) => {
    try {
      const offerData = { ...req.body, supplierId: req.user.id };
      const offer = await storage.createSupplyOffer(offerData);
      res.json(offer);
    } catch (error) {
      console.error('Create supply offer error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/supply-offers', authenticateToken, requireRole(['supplier']), async (req: any, res: Response) => {
    try {
      const offers = await storage.getSupplyOffersBySupplier(req.user.id);
      res.json(offers);
    } catch (error) {
      console.error('Get supply offers error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Daily demand routes
  app.get('/api/daily-demand', authenticateToken, requireRole(['supplier', 'admin']), async (req: Request, res: Response) => {
    try {
      const date = new Date();
      const demands = await storage.getDailyDemandByDate(date);
      res.json(demands);
    } catch (error) {
      console.error('Get daily demand error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Special request routes
  app.post('/api/special-requests', authenticateToken, requireRole(['vendor']), async (req: any, res: Response) => {
    try {
      const requestData = { ...req.body, vendorId: req.user.id };
      const request = await storage.createSpecialRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error('Create special request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/special-requests', authenticateToken, async (req: any, res: Response) => {
    try {
      if (req.user.role === 'vendor') {
        const requests = await storage.getSpecialRequestsByVendor(req.user.id);
        res.json(requests);
      } else if (req.user.role === 'supplier' || req.user.role === 'admin') {
        const requests = await storage.getAllSpecialRequests();
        res.json(requests);
      } else {
        res.status(403).json({ message: 'Insufficient permissions' });
      }
    } catch (error) {
      console.error('Get special requests error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/special-requests/vendor', authenticateToken, requireRole(['vendor']), async (req: any, res: Response) => {
    try {
      const requests = await storage.getSpecialRequestsByVendor(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error('Get vendor special requests error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/special-requests/:id/respond', authenticateToken, requireRole(['supplier']), async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const responseData = {
        ...req.body,
        requestId: id,
        supplierId: req.user.id
      };
      
      const response = await storage.createSpecialRequestResponse(responseData);
      res.json(response);
    } catch (error) {
      console.error('Create special request response error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin routes for comprehensive management
  app.get('/api/admin/users', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/orders', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const orders = await storage.getAllOrdersWithDetails();
      res.json(orders);
    } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/admin/orders/:id/status', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/admin/users/:id/status', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const user = await storage.updateUserStatus(id, isActive);
      res.json(user);
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Analytics routes
  app.get('/api/analytics/vendor', authenticateToken, requireRole(['vendor']), async (req: any, res: Response) => {
    try {
      const stats = await storage.getVendorStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error('Get vendor stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/analytics/supplier', authenticateToken, requireRole(['supplier']), async (req: any, res: Response) => {
    try {
      const stats = await storage.getSupplierStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error('Get supplier stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/analytics/admin', authenticateToken, requireRole(['admin']), async (req: any, res: Response) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
