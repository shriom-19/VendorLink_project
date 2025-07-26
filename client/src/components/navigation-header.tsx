import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Store, ShoppingCart, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/contexts/cart-context';
import { RoleSwitchModal } from './role-switch-modal';
import { CartModal } from './cart-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavigationHeaderProps {
  onRoleSwitch?: () => void;
}

export function NavigationHeader({ onRoleSwitch }: NavigationHeaderProps) {
  const { user, logout } = useAuth();
  const { totalItems, totalAmount } = useCart();
  const [isRoleSwitchOpen, setIsRoleSwitchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const getNavItems = () => {
    switch (user?.role) {
      case 'vendor':
        return [
          { label: 'Dashboard', href: '#', active: true },
          { label: 'Orders', href: '#' },
          { label: 'Special Requests', href: '#' },
          { label: 'Support', href: '#' },
        ];
      case 'supplier':
        return [
          { label: 'Dashboard', href: '#', active: true },
          { label: 'Supply Offers', href: '#' },
          { label: 'Analytics', href: '#' },
          { label: 'Profile', href: '#' },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', href: '#', active: true },
          { label: 'Users', href: '#' },
          { label: 'Products', href: '#' },
          { label: 'Reports', href: '#' },
        ];
      default:
        return [];
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'vendor': return 'bg-blue-600';
      case 'supplier': return 'bg-green-600';
      case 'admin': return 'bg-gray-600';
      default: return 'bg-gray-400';
    }
  };

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Store className="h-8 w-8 text-blue-600 mr-2" />
                <h1 className="text-xl font-bold text-gray-900">VendorSupply</h1>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                {getNavItems().map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.active
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {user?.role === 'vendor' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCartOpen(true)}
                  className="relative"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                  {totalItems > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1 min-w-[1.25rem] h-5">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`${getRoleColor()} text-white`}>
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <Badge variant="secondary" className="w-fit mt-1">
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsRoleSwitchOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Switch Role
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <RoleSwitchModal 
        open={isRoleSwitchOpen}
        onOpenChange={setIsRoleSwitchOpen}
        onRoleSwitch={onRoleSwitch}
      />

      {user?.role === 'vendor' && (
        <CartModal 
          open={isCartOpen}
          onOpenChange={setIsCartOpen}
        />
      )}
    </>
  );
}
