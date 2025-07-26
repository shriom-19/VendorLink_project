import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DailyDemand, Product } from '@shared/schema';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface SupplyOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demand: (DailyDemand & { product: Product }) | null;
  onOfferSubmitted?: () => void;
}

export function SupplyOfferModal({ 
  open, 
  onOpenChange, 
  demand, 
  onOfferSubmitted 
}: SupplyOfferModalProps) {
  const [formData, setFormData] = useState({
    availableQuantity: '',
    pricePerUnit: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demand || !token) return;

    setIsSubmitting(true);
    try {
      const offerData = {
        productId: demand.product.id,
        availableQuantity: parseInt(formData.availableQuantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        deliveryDate: new Date(formData.deliveryDate).toISOString(),
        notes: formData.notes,
      };

      const response = await fetch('/api/supply-offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(offerData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit offer');
      }

      toast({
        title: "Offer submitted successfully!",
        description: "Your supply offer has been recorded.",
      });

      setFormData({
        availableQuantity: '',
        pricePerUnit: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      
      onOfferSubmitted?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to submit offer",
        description: "There was an error submitting your offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!demand) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supply Offer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="product">Product</Label>
            <Input
              id="product"
              value={demand.product.name}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="remaining-demand">Remaining Demand</Label>
            <Input
              id="remaining-demand"
              value={`${demand.remainingDemand} ${demand.product.unit}`}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity You Can Supply *</Label>
            <div className="relative">
              <Input
                id="quantity"
                type="number"
                min="1"
                max={demand.remainingDemand}
                value={formData.availableQuantity}
                onChange={(e) => handleInputChange('availableQuantity', e.target.value)}
                placeholder="Enter quantity"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                {demand.product.unit}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="price">Your Price per Unit *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePerUnit}
                onChange={(e) => handleInputChange('pricePerUnit', e.target.value)}
                placeholder="0.00"
                className="pl-8"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="delivery-date">Delivery Date *</Label>
            <Input
              id="delivery-date"
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
