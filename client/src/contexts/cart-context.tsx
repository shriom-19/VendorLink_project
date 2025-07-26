import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@shared/schema';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountApplied: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  totalSavings: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const calculateDiscount = (product: Product, quantity: number) => {
    if (product.bulkDiscountThreshold && quantity >= product.bulkDiscountThreshold && product.bulkDiscountPercentage) {
      return Number(product.bulkDiscountPercentage);
    }
    return 0;
  };

  const addToCart = (product: Product, quantity: number) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.product.id === product.id);
      
      if (existingItemIndex >= 0) {
        const newItems = [...prevItems];
        const existingItem = newItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        const discountApplied = calculateDiscount(product, newQuantity);
        const unitPrice = Number(product.basePrice) * (1 - discountApplied / 100);
        
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          unitPrice,
          totalPrice: unitPrice * newQuantity,
          discountApplied
        };
        
        return newItems;
      } else {
        const discountApplied = calculateDiscount(product, quantity);
        const unitPrice = Number(product.basePrice) * (1 - discountApplied / 100);
        
        return [...prevItems, {
          product,
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
          discountApplied
        }];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.product.id === productId) {
          const discountApplied = calculateDiscount(item.product, quantity);
          const unitPrice = Number(item.product.basePrice) * (1 - discountApplied / 100);
          
          return {
            ...item,
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity,
            discountApplied
          };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalSavings = items.reduce((sum, item) => {
    const originalPrice = Number(item.product.basePrice) * item.quantity;
    return sum + (originalPrice - item.totalPrice);
  }, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalItems,
      totalAmount,
      totalSavings
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
