import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Product } from '@shared/schema';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(0);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const basePrice = Number(product.basePrice);
  const discount = product.bulkDiscountThreshold && quantity >= product.bulkDiscountThreshold 
    ? Number(product.bulkDiscountPercentage) 
    : 0;
  const discountedPrice = basePrice * (1 - discount / 100);

  const handleAddToCart = () => {
    if (quantity <= 0) {
      toast({
        title: "Please select a quantity",
        description: "Choose how many items you want to add to cart.",
        variant: "destructive",
      });
      return;
    }

    addToCart(product, quantity);
    setQuantity(0);
    
    toast({
      title: "Added to cart!",
      description: `${quantity} ${product.unit} of ${product.name} added to your cart.`,
    });
  };

  const updateQuantity = (change: number) => {
    const newQuantity = Math.max(0, quantity + change);
    setQuantity(newQuantity);
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="relative">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-blue-400" />
          </div>
        )}
        
        {discount > 0 && (
          <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-700">
            {discount}% OFF
          </Badge>
        )}
      </div>
      
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-blue-600">
              ₹{discountedPrice.toFixed(2)}
            </span>
            <span className="text-gray-500">/{product.unit}</span>
            {discount > 0 && (
              <div className="text-xs text-gray-400 line-through">
                ₹{basePrice.toFixed(2)}
              </div>
            )}
          </div>
          
          {product.bulkDiscountThreshold && (
            <div className="text-right">
              <div className="text-sm text-green-600 font-medium">
                {product.bulkDiscountPercentage}% off {product.bulkDiscountThreshold}+ {product.unit}
              </div>
              <div className="text-xs text-gray-500">Bulk discount</div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateQuantity(-1)}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="px-3 py-2 font-medium min-w-[3rem] text-center">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateQuantity(1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleAddToCart}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={quantity <= 0}
          >
            Add to Cart
          </Button>
        </div>
        
        {quantity >= (product.bulkDiscountThreshold || 0) && product.bulkDiscountThreshold && (
          <div className="mt-3 p-2 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              🎉 Bulk discount applies! Save {product.bulkDiscountPercentage}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
