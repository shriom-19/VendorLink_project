import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, Users, Package, TrendingUp, AlertTriangle, CheckCircle, 
  Plus, Edit, Trash2, Eye, FileText, Bell, Settings, Activity, Calendar 
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function ComprehensiveAdminDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all users
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: !!token && user?.role === 'admin',
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // Fetch all orders
  const { data: allOrders = [] } = useQuery({
    queryKey: ['/api/admin/orders'],
    enabled: !!token && user?.role === 'admin',
    queryFn: async () => {
      const response = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
    enabled: !!token,
  });

  // Fetch special requests
  const { data: specialRequests = [] } = useQuery({
    queryKey: ['/api/special-requests'],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch('/api/special-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch special requests');
      return response.json();
    },
  });

  // Fetch daily demand
  const { data: dailyDemand = [] } = useQuery({
    queryKey: ['/api/daily-demand'],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch('/api/daily-demand', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch daily demand');
      return response.json();
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest(`/api/admin/orders/${orderId}/status`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Order status updated successfully" });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return await apiRequest(`/api/admin/users/${userId}/status`, 'PATCH', { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User status updated successfully" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'supplier': return 'bg-green-100 text-green-700';
      case 'vendor': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const vendorCount = users.filter(u => u.role === 'vendor').length;
  const supplierCount = users.filter(u => u.role === 'supplier').length;
  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold">Administrator Dashboard</h2>
            <p className="mt-2 text-purple-100">
              Complete platform management and oversight
            </p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-500 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{vendorCount}</div>
                <div className="text-sm text-purple-100">Vendors</div>
              </div>
              <div className="bg-purple-500 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{supplierCount}</div>
                <div className="text-sm text-purple-100">Suppliers</div>
              </div>
              <div className="bg-purple-500 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{totalOrders}</div>
                <div className="text-sm text-purple-100">Total Orders</div>
              </div>
              <div className="bg-purple-500 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{pendingOrders}</div>
                <div className="text-sm text-purple-100">Pending Orders</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="special-requests">Special Requests</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allOrders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Order #{order.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600">₹{Number(order.totalAmount).toFixed(2)}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Demand Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dailyDemand.slice(0, 5).map((demand: any) => (
                      <div key={demand.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{demand.product?.name}</p>
                          <p className="text-sm text-gray-600">{demand.totalDemand} {demand.product?.unit}</p>
                        </div>
                        <span className="text-sm text-orange-600">
                          {demand.remainingDemand} remaining
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">{pendingOrders} orders pending review</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">All systems operational</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{specialRequests.length} special requests</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vendors" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(u => u.role === 'vendor').map((vendor: any) => (
                      <TableRow key={vendor.id}>
                        <TableCell>{vendor.firstName} {vendor.lastName}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>{vendor.phone || 'Not provided'}</TableCell>
                        <TableCell>
                          <Badge className={vendor.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {vendor.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(vendor.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatusMutation.mutate({ 
                              userId: vendor.id, 
                              isActive: !vendor.isActive 
                            })}
                          >
                            {vendor.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(u => u.role === 'supplier').map((supplier: any) => (
                      <TableRow key={supplier.id}>
                        <TableCell>{supplier.firstName} {supplier.lastName}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>{supplier.phone || 'Not provided'}</TableCell>
                        <TableCell>
                          <Badge className={supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {supplier.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(supplier.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatusMutation.mutate({ 
                              userId: supplier.id, 
                              isActive: !supplier.isActive 
                            })}
                          >
                            {supplier.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Tracking & Fulfillment</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id.slice(-8)}</TableCell>
                        <TableCell>Order #{order.id.slice(-8)}</TableCell>
                        <TableCell>₹{Number(order.totalAmount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatusMutation.mutate({ 
                                orderId: order.id, 
                                status: 'confirmed' 
                              })}
                              disabled={order.status === 'delivered'}
                            >
                              Mark Delivered
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Catalog Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>₹{Number(product.basePrice).toFixed(2)}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>
                          <Badge className={product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="special-requests" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Special Request Management</CardTitle>
              </CardHeader>
              <CardContent>
                {specialRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No special requests</h3>
                    <p className="text-gray-600">Special requests will appear here for admin review.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {specialRequests.map((request: any) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{request.itemName}</h4>
                            <p className="text-gray-600 mb-2">{request.description}</p>
                            <div className="text-sm text-gray-500">
                              <span>Quantity: {request.quantity} {request.unit}</span>
                              {request.budgetPerUnit && (
                                <span className="ml-4">Budget: ₹{Number(request.budgetPerUnit).toFixed(2)}/{request.unit}</span>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Users</span>
                      <span className="font-semibold">{users.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Products</span>
                      <span className="font-semibold">{products.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Orders</span>
                      <span className="font-semibold">{allOrders.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Special Requests</span>
                      <span className="font-semibold">{specialRequests.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['pending', 'confirmed', 'delivered', 'cancelled'].map(status => {
                      const count = allOrders.filter((o: any) => o.status === status).length;
                      return (
                        <div key={status} className="flex justify-between">
                          <span className="capitalize">{status}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Role Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['vendor', 'supplier', 'admin'].map(role => {
                      const count = users.filter((u: any) => u.role === role).length;
                      return (
                        <div key={role} className="flex justify-between">
                          <span className="capitalize">{role}s</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}