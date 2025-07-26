import { useState } from 'react';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, MapPin, Package, IndianRupee, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function Checkout() {
  const { user, token } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderData, setOrderData] = useState({
    deliveryAddress: user?.address || '',
    notes: '',
    paymentMethod: 'cash_on_delivery'
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await apiRequest('/api/orders', 'POST', orderData);
    },
    onSuccess: (data) => {
      setOrderPlaced(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/vendor'] });
      toast({
        title: "Order placed successfully!",
        description: `Your order #${data.id.slice(-8)} has been submitted.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to place order",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = async () => {
    if (!orderData.deliveryAddress.trim()) {
      toast({
        title: "Missing delivery address",
        description: "Please provide a delivery address.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const orderPayload = {
        deliveryAddress: orderData.deliveryAddress,
        notes: orderData.notes,
        totalAmount: totalAmount,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.basePrice,
          totalPrice: item.totalPrice
        }))
      };
      
      placeOrderMutation.mutate(orderPayload);
      setIsProcessing(false);
    }, 2000);
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center">
            <CardContent className="p-12">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
              <p className="text-gray-600 mb-8">
                Thank you for your order. We'll process it and have it ready for delivery by tomorrow morning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => window.location.href = '/orders'}>
                  View Orders
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center">
            <CardContent className="p-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
              <p className="text-gray-600 mb-6">Add some products to proceed with checkout.</p>
              <Button onClick={() => window.location.href = '/'}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-2 text-gray-600">Review your order and complete the purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.product.unit} × ₹{Number(item.product.basePrice).toFixed(2)}
                      </p>
                      {item.discount > 0 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {item.discount}% bulk discount applied
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{item.totalPrice.toFixed(2)}</p>
                      {item.discount > 0 && (
                        <p className="text-xs text-gray-500 line-through">
                          ₹{(item.quantity * Number(item.product.basePrice)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {totalAmount.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery & Payment */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Textarea
                      id="address"
                      value={orderData.deliveryAddress}
                      onChange={(e) => setOrderData({ ...orderData, deliveryAddress: e.target.value })}
                      placeholder="Enter your complete delivery address..."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={orderData.notes}
                      onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                      placeholder="Any special instructions for delivery..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="cod"
                      name="payment"
                      value="cash_on_delivery"
                      checked={orderData.paymentMethod === 'cash_on_delivery'}
                      onChange={(e) => setOrderData({ ...orderData, paymentMethod: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      Cash on Delivery
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-50">
                    <input
                      type="radio"
                      id="online"
                      name="payment"
                      value="online"
                      disabled
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="online" className="flex-1 cursor-not-allowed">
                      Online Payment (Coming Soon)
                    </Label>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Cash on Delivery:</strong> Pay when your order is delivered. 
                    Our delivery partner will collect the payment.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button
              onClick={handlePlaceOrder}
              disabled={isProcessing || placeOrderMutation.isPending}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Place Order - ₹{totalAmount.toFixed(2)}
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By placing this order, you agree to our terms and conditions. 
              Expected delivery: Tomorrow by 6 AM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}