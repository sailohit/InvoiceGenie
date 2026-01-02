import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderDetailsFormProps {
  orderDetails: {
    orderNumber: string;
    invoiceNumber: string;
    orderDate: string;
    productName: string;
    productId?: number;
    quantity: string | number;
    unitPrice: string | number;
    shippingCharges: string | number;
    paymentMethod: string;
    trackingNumber: string;
    // New fields
    taxRate?: number | string;
    currency?: string;
    companyTaxName?: string;
  };
  onChange: (details: OrderDetailsFormProps['orderDetails']) => void;
}

export const OrderDetailsForm = ({ orderDetails, onChange }: OrderDetailsFormProps) => {
  const products = useLiveQuery(() => db.products.toArray());

  const handleChange = (field: string, value: string | number) => {
    onChange({
      ...orderDetails,
      [field]: value,
    });
  };

  const [open, setOpen] = useState(false);

  const handleProductSelect = (productId: number) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      onChange({
        ...orderDetails,
        productName: product.name,
        productId: product.id,
        unitPrice: product.price,
        // Optional: Auto-set quantity to 1 if empty?
      });
      setOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-invoice-accent" />
        <h3 className="font-semibold text-lg">Order & Product Details</h3>
      </div>

      {/* ... previous grid ... */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="orderNumber">Order Number</Label>
          <Input
            id="orderNumber"
            value={orderDetails.orderNumber}
            onChange={(e) => handleChange('orderNumber', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            value={orderDetails.invoiceNumber}
            onChange={(e) => handleChange('invoiceNumber', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="orderDate">Order Date</Label>
          <Input
            id="orderDate"
            type="date"
            value={orderDetails.orderDate}
            onChange={(e) => handleChange('orderDate', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2 flex flex-col">
        <Label>Product Name</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal text-left"
            >
              <div className="flex flex-col items-start truncate">
                <span className="truncate">{orderDetails.productName || "Select product..."}</span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search products..." />
              <CommandList>
                <CommandEmpty>No product found.</CommandEmpty>
                <CommandGroup>
                  {products?.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={() => handleProductSelect(product.id!)}
                      className="flex flex-col items-start py-2"
                    >
                      <div className="flex w-full justify-between items-center">
                        <span className="font-medium">{product.name}</span>
                        <span className="font-mono text-xs">₹{product.price}</span>
                      </div>
                      <div className="flex w-full justify-between items-center text-xs text-muted-foreground mt-1">
                        <span>SKU: {product.sku || '-'}</span>
                        <span className={cn(
                          "font-medium",
                          product.inventory === 0 ? "text-destructive" :
                            product.inventory <= (product.minStock || 5) ? "text-yellow-600" : "text-green-600"
                        )}>
                          Stock: {product.inventory}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="text"
            value={orderDetails.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price ({orderDetails.currency})</Label>
          <Input
            id="unitPrice"
            type="text"
            value={orderDetails.unitPrice}
            onChange={(e) => handleChange('unitPrice', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shippingCharges">Shipping ({orderDetails.currency})</Label>
          <Input
            id="shippingCharges"
            type="text"
            value={orderDetails.shippingCharges}
            onChange={(e) => handleChange('shippingCharges', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="taxRate">{orderDetails.companyTaxName || 'Tax'} Rate (%)</Label>
          <Input
            id="taxRate"
            type="number"
            value={orderDetails.taxRate}
            onChange={(e) => handleChange('taxRate', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Total Amount ({orderDetails.currency})</Label>
          <div className="flex flex-col justify-center h-10 px-3 py-2 text-lg font-bold">
            {(() => {
              const qty = parseFloat(orderDetails.quantity.toString()) || 0;
              const price = parseFloat(orderDetails.unitPrice.toString()) || 0;
              const ship = parseFloat(orderDetails.shippingCharges.toString()) || 0;
              const tax = parseFloat(orderDetails.taxRate?.toString() || "0");

              const subtotal = qty * price;
              const taxAmt = subtotal * (tax / 100);
              const total = subtotal + taxAmt + ship;

              // Implicitly update parent state with derived values would cause render loop.
              // Ideally we calculate this on save or in a useEffect in parent.
              // For display, we just compute here.
              return `${(new Intl.NumberFormat('en-US', { style: 'currency', currency: orderDetails.currency || 'INR' }).format(total))}`;
            })()}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select
          value={orderDetails.paymentMethod}
          onValueChange={(value) => handleChange('paymentMethod', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Prepaid">Prepaid</SelectItem>
            <SelectItem value="COD">Cash on Delivery (COD)</SelectItem>
            <SelectItem value="UPI">UPI</SelectItem>
            <SelectItem value="Card">Card Payment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trackingNumber">Tracking Number (Editable)</Label>
        <Input
          id="trackingNumber"
          placeholder="e.g. TRK123456789"
          value={orderDetails.trackingNumber}
          onChange={(e) => handleChange('trackingNumber', e.target.value)}
        />
      </div>
    </div>
  );
};
