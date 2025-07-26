import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';
import { SupplyOfferModal } from '@/components/supply-offer-modal';
import { DailyDemand, Product, SpecialRequest, User } from '@shared/schema';

export default function SupplierDashboard() {
  const { user, token } = useAuth();
  const [selectedDemand, setSelectedDemand] = useState<(DailyDemand & { product: Product }) | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  // Fetch supplier stats
  const { data: stats } = useQuery({
    queryKey: ['/api/analytics/supplier'],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch('/api/analytics/supplier', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Fetch daily demand
  const { data: demands = [], refetch: refetchDemands } = useQuery({
    queryKey: ['/api/daily-demand'],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch('/api/daily-demand', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch demands');
      return response.json();
    },
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

  const handleMakeOffer = (demand: DailyDemand & { product: Product }) => {
    setSelectedDemand(demand);
    setIsOfferModalOpen(true);
  };

  const handleOfferSubmitted = () => {
    refetchDemands();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'open': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Supplier Dashboard</h2>
            <p className="mt-2 text-green-100">
              View aggregated demand and submit your supply offers
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <div className="bg-green-500 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">₹{(stats?.revenue || 0).toLocaleString()}</div>
                <div className="text-sm text-green-100">Total Revenue</div>
              </div>
              <div className="bg-green-500 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{stats?.fulfillmentRate || 0}%</div>
                <div className="text-sm text-green-100">Fulfillment Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Daily Demand Summary */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Today's Aggregated Demand</CardTitle>
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {demands.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No demand data</h3>
                <p className="text-gray-600">Check back later for today's aggregated demand.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold">Product</th>
                      <th className="text-left py-3 px-4 font-semibold">Total Demand</th>
                      <th className="text-left py-3 px-4 font-semibold">Fulfilled</th>
                      <th className="text-left py-3 px-4 font-semibold">Remaining</th>
                      <th className="text-left py-3 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demands.map((demand: DailyDemand & { product: Product }) => (
                      <tr key={demand.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{demand.product.name}</div>
                              <div className="text-sm text-gray-600">{demand.product.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-gray-900">
                            {demand.totalDemand} {demand.product.unit}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-green-600 font-medium">
                            {demand.fulfilledQuantity} {demand.product.unit}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-orange-600 font-semibold">
                            {demand.remainingDemand} {demand.product.unit}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {demand.remainingDemand > 0 ? (
                            <Button
                              onClick={() => handleMakeOffer(demand)}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              Make Offer
                            </Button>
                          ) : (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Fulfilled
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Special Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Special Requests from Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {specialRequests.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No special requests</h3>
                <p className="text-gray-600">Check back later for vendor special requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {specialRequests.map((request: SpecialRequest & { vendor: User }) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{request.itemName}</h4>
                        <p className="text-gray-600 mt-1">{request.description}</p>
                        <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
                          <span>
                            Requested by: <span className="font-medium">{request.vendor.firstName} {request.vendor.lastName}</span>
                          </span>
                          <span>
                            Quantity: <span className="font-medium">{request.quantity} {request.unit}</span>
                          </span>
                          {request.budgetPerUnit && (
                            <span>
                              Budget: <span className="font-medium">₹{Number(request.budgetPerUnit).toFixed(2)}/{request.unit}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          I Can Supply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SupplyOfferModal
        open={isOfferModalOpen}
        onOpenChange={setIsOfferModalOpen}
        demand={selectedDemand}
        onOfferSubmitted={handleOfferSubmitted}
      />
    </div>
  );
}
