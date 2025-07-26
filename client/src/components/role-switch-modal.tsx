import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Truck, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface RoleSwitchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleSwitch?: () => void;
}

export function RoleSwitchModal({ open, onOpenChange, onRoleSwitch }: RoleSwitchModalProps) {
  const { user } = useAuth();

  const roles = [
    {
      id: 'vendor',
      title: 'Vendor Portal',
      description: 'Order raw materials for your business',
      icon: ShoppingCart,
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200 hover:border-blue-500',
      iconColor: 'text-blue-600',
    },
    {
      id: 'supplier',
      title: 'Supplier Portal', 
      description: 'Supply materials to vendors',
      icon: Truck,
      bgColor: 'bg-green-50 hover:bg-green-100',
      borderColor: 'border-green-200 hover:border-green-500',
      iconColor: 'text-green-600',
    },
    {
      id: 'admin',
      title: 'Admin Panel',
      description: 'Manage platform operations',
      icon: Shield,
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      borderColor: 'border-gray-200 hover:border-gray-500',
      iconColor: 'text-gray-600',
    },
  ];

  const handleRoleSelect = (roleId: string) => {
    // In a real app, this would make an API call to update user role
    // For demo purposes, we'll just simulate a role switch
    onRoleSwitch?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select User Role</DialogTitle>
          <DialogDescription>
            Choose the role you want to switch to for this session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {roles.map((role) => {
            const Icon = role.icon;
            const isCurrentRole = user?.role === role.id;
            
            return (
              <Button
                key={role.id}
                variant="outline"
                className={`w-full p-4 h-auto text-left justify-start ${role.bgColor} ${role.borderColor} transition-all duration-200`}
                onClick={() => handleRoleSelect(role.id)}
                disabled={isCurrentRole}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${role.iconColor}`} />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {role.title}
                      {isCurrentRole && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {role.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
