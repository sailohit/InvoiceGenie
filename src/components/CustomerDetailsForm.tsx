import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Search, Check } from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/db";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { OrderData } from '@/utils/orderUtils';

interface CustomerDetailsFormProps {
    customerData: Partial<OrderData>;
    onChange: (data: Partial<OrderData>) => void;
}

export const CustomerDetailsForm = ({ customerData, onChange }: CustomerDetailsFormProps) => {
    const [open, setOpen] = useState(false);
    const customers = useLiveQuery(() => db.customers.toArray());

    const handleChange = (field: string, value: string) => {
        onChange({
            ...customerData,
            [field]: value,
        });
    };

    const handleSelectCustomer = (customerId: number) => {
        const customer = customers?.find(c => c.id === customerId);
        if (customer) {
            // Split name into first and last
            const nameParts = customer.name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');

            onChange({
                ...customerData,
                firstName: firstName,
                lastName: lastName,
                email: customer.email || '',
                phone: customer.phone || '',
                building: customer.building || '',
                streetAddress: customer.streetAddress || '',
                locality: customer.locality || '',
                city: customer.city || '',
                state: customer.state || '',
                pincode: customer.pincode || ''
            });
            setOpen(false);
        }
    };

    if (!customerData) return null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-invoice-accent" />
                    <h3 className="font-semibold text-lg">Customer Details</h3>
                </div>

                {/* Customer Search */}
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-[250px] justify-between"
                        >
                            <span className="truncate">Active: {customerData.firstName ? `${customerData.firstName} ${customerData.lastName}` : "Select stored customer..."}</span>
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                        <Command>
                            <CommandInput placeholder="Search saved customers..." />
                            <CommandList>
                                <CommandEmpty>No customer found.</CommandEmpty>
                                <CommandGroup>
                                    {customers?.map((customer) => (
                                        <CommandItem
                                            key={customer.id}
                                            value={customer.name}
                                            onSelect={() => handleSelectCustomer(customer.id!)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    (customerData.email === customer.email && customerData.phone === customer.phone)
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{customer.name}</span>
                                                <span className="text-xs text-muted-foreground">{customer.phone}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                        id="firstName"
                        value={customerData.firstName || ''}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        placeholder="John"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                        id="lastName"
                        value={customerData.lastName || ''}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        placeholder="Doe"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={customerData.email || ''}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="john@example.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        value={customerData.phone || ''}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="building">Building / House No.</Label>
                <Input
                    id="building"
                    value={customerData.building || ''}
                    onChange={(e) => handleChange('building', e.target.value)}
                    placeholder="Flat 101, Sunshine Heights"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="streetAddress">Street Address</Label>
                    <Input
                        id="streetAddress"
                        value={customerData.streetAddress || ''}
                        onChange={(e) => handleChange('streetAddress', e.target.value)}
                        placeholder="Main Road"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="locality">Locality</Label>
                    <Input
                        id="locality"
                        value={customerData.locality || ''}
                        onChange={(e) => handleChange('locality', e.target.value)}
                        placeholder="Cyber City"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                        id="city"
                        value={customerData.city || ''}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="Gurgaon"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                        id="state"
                        value={customerData.state || ''}
                        onChange={(e) => handleChange('state', e.target.value)}
                        placeholder="Haryana"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                        id="pincode"
                        value={customerData.pincode || ''}
                        onChange={(e) => handleChange('pincode', e.target.value)}
                        placeholder="122001"
                    />
                </div>
            </div>
        </div>
    );
};
