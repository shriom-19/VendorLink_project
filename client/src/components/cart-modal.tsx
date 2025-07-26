import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface CartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartModal({ open, onOpenChange }: CartModalProps) {
  const { items, updateQuantity, removeFromCart, clearCart, totalAmount, totalSavings } = useCart();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!user || !token) {
      toast({
        title: "Authentication required",
        description: "Please log in to place an order.",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderData = {
        totalAmount,
        deliveryAddress: user.address || "Default address",
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          discountApplied: item.discountApplied,
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      clearCart();
      onOpenChange(false);
      
      toast({
        title: "Order placed successfully!",
        description: "Your order will be delivered by tomorrow morning.",
      });
    } catch (error) {
      toast({
        title: "Order failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (items.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Cart</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-8">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">Your cart is empty</p>
            <p className="text-sm text-gray-400 text-center mt-2">
              Add some products to get started
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Your Cart
            <Badge variant="secondary">{items.length} items</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  {item.product.imageUrl ? (
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ShoppingCart className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-gray-600">
                    ₹{item.unitPrice.toFixed(2)}/{item.product.unit}
                  </p>
                  {item.discountApplied > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {item.discountApplied}% off
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-2 font-medium min-w-[3rem] text-center">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-right min-w-[5rem]">
                  <div className="font-semibold">₹{item.totalPrice.toFixed(2)}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-600 hover:text-red-700 p-0 h-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">Total Amount:</span>
            <span className="text-2xl font-bold text-blue-600">
              ₹{totalAmount.toFixed(2)}
            </span>
          </div>
          
          {totalSavings > 0 && (
            <div className="text-sm text-green-600 mb-4 flex items-center">
              <Badge variant="secondary" className="mr-2">
                💰 Bulk Savings
              </Badge>
              You saved ₹{totalSavings.toFixed(2)} with bulk discounts!
            </div>
          )}
          
          <Button 
            onClick={handleCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            size="lg"
          >
            Proceed to Checkout
          </Button>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            Delivery by tomorrow morning, 6 AM
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
