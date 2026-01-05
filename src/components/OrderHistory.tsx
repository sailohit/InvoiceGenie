import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Search, Mail, MessageCircle, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, forwardRef, useImperativeHandle } from "react";
import { Badge } from "@/components/ui/badge";
import { generateWhatsAppLink, generateEmailLink, generateGmailLink } from "@/utils/orderUtils";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoicePreview } from "./InvoicePreview";
import { generatePDF } from '@/utils/pdfGenerator';

export interface OrderHistoryRef {
    open: () => void;
}

interface OrderHistoryProps {
    onViewOrder: (order: any) => void;
}

export const OrderHistory = forwardRef<OrderHistoryRef, OrderHistoryProps>(({ onViewOrder }, ref) => {
    const orders = useLiveQuery(() => db.orders.reverse().toArray());
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [orderForPdf, setOrderForPdf] = useState<any>(null);

    useImperativeHandle(ref, () => ({
        open: () => setIsOpen(true)
    }));

    const filteredOrders = orders?.filter((order) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            order.firstName?.toLowerCase().includes(searchLower) ||
            order.lastName?.toLowerCase().includes(searchLower) ||
            order.orderNumber?.toLowerCase().includes(searchLower) ||
            order.invoiceNumber?.toLowerCase().includes(searchLower)
        );
    });

    const handleCommunication = async (order: any, type: 'email' | 'whatsapp' | 'whatsapp-dispatch' | 'gmail') => {
        const customerName = `${order.firstName} ${order.lastName}`;
        const invoiceNum = order.invoiceNumber || 'Invoice';

        // Calculate total if missing (backward compatibility)
        let total = Number(order.totalAmount) || 0;
        if (total === 0) {
            const qty = Number(order.quantity) || 0;
            const price = Number(order.unitPrice) || 0;
            const ship = Number(order.shippingCharges) || 0;
            const tax = Number(order.taxRate) || 0;
            const sub = qty * price;
            total = sub + (sub * (tax / 100)) + ship;
        }

        const currencySymbol = order.currencySymbol || (order.currency === 'USD' ? '$' : '₹');
        const formattedTotal = total.toLocaleString(order.currency === 'USD' ? 'en-US' : 'en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Auto-download PDF for Dispatch OR Email OR Gmail
        if (type === 'whatsapp-dispatch' || type === 'email' || type === 'gmail') {
            toast.info("Generating Invoice PDF...");
            setOrderForPdf(order);
            // Allow DOM to update
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                const namePrefix = order.firstName ? `${order.firstName}-` : '';
                await generatePDF('hidden-invoice-preview', `${namePrefix}Invoice_${invoiceNum}`);
                toast.success((type === 'email' || type === 'gmail') ? "Invoice downloaded! Please attach it to the email." : "Invoice downloaded! Please drag it into WhatsApp.");
            } catch (e) {
                console.error(e);
                toast.error("Failed to generate PDF");
            }
            setOrderForPdf(null);
        }

        if (type === 'whatsapp' || type === 'whatsapp-dispatch') {
            if (!order.phone) {
                toast.error("No phone number available");
                return;
            }
            // ... (rest of whatsapp logic)

            let msg = '';
            if (type === 'whatsapp-dispatch') {
                const fullAddress = [
                    order.building,
                    order.streetAddress,
                    order.locality,
                    order.city,
                    order.state,
                    order.pincode
                ].filter(Boolean).join('\n');

                const companyNameText = order.companyName || 'Your Company';
                msg = `Hello ${customerName} ��

Thank you for your order with *${companyNameText}* ❤️
Your order has been packed and dispatched successfully.

📄 Invoice No: ${invoiceNum}
📦 Order ID: ${order.orderNumber || 'N/A'}
🚚 Tracking ID: ${order.trackingNumber || 'Pending'}

📍 Delivery Address:
${fullAddress}

You can track your shipment using the above tracking ID with the courier partner.
For any assistance, feel free to reach out to us.

${companyNameText}`;

            } else {
                // Payment Reminder Standard Type
                const companyNameText = order.companyName || 'Invoice';
                msg = `Hi ${customerName}, here is your invoice ${invoiceNum}. Total: ${currencySymbol}${formattedTotal}. Please pay by ${order.dueDate || 'due date'}.`;
            }

            const link = generateWhatsAppLink(order.phone, msg);
            window.open(link, '_blank');
        } else if (type === 'email' || type === 'gmail') {
            if (!order.email) {
                toast.error("No email available");
                return;
            }
            const subject = `Invoice ${invoiceNum}`;
            const body = `Hi ${customerName},\n\nPlease find attached your invoice ${invoiceNum}.\n\nTotal Due: ${currencySymbol}${formattedTotal}\n\nThank you`;

            if (type === 'gmail') {
                const link = generateGmailLink(order.email, subject, body);
                if (!link) {
                    toast.error("Invalid email address");
                    return;
                }
                window.open(link, '_blank');
            } else {
                const link = generateEmailLink(order.email, subject, body);
                if (!link) {
                    toast.error("Invalid email address");
                    return;
                }
                window.open(link, '_blank');
            }
        }
    };

    const toggleStatus = async (orderId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
        await db.orders.update(orderId, { status: newStatus });
        toast.success(`Marked as ${newStatus}`);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Eye className="w-4 h-4" />
                        History
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Order History</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search orders..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="border rounded-md flex-1 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders?.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>{order.orderDate}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{order.firstName} {order.lastName}</span>
                                                    <span className="text-xs text-muted-foreground">{order.invoiceNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    let total = Number(order.totalAmount) || 0;
                                                    if (total === 0) {
                                                        const qty = Number(order.quantity) || 0;
                                                        const price = Number(order.unitPrice) || 0;
                                                        const ship = Number(order.shippingCharges) || 0;
                                                        const tax = Number(order.taxRate) || 0;
                                                        total = (qty * price) * (1 + tax / 100) + ship;
                                                    }
                                                    return `${order.currencySymbol || (order.currency === 'USD' ? '$' : '₹')}${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={order.status === 'Paid' ? 'default' : 'secondary'}
                                                    className={order.status === 'Paid' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleStatus(order.id!, order.status || 'Pending');
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {order.status || 'Pending'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => { onViewOrder(order); setIsOpen(false); }}>
                                                        Load
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => handleCommunication(order, 'email')}>
                                                                <Mail className="w-4 h-4 mr-2" /> Default Email App
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleCommunication(order, 'gmail')}>
                                                                <Mail className="w-4 h-4 mr-2" /> Send via Gmail
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleCommunication(order, 'whatsapp')}>
                                                                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp Reminder
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleCommunication(order, 'whatsapp-dispatch')}>
                                                                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp Dispatch
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredOrders?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No orders found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden Invoice Preview for PDF Generation */}
            {orderForPdf && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                    <div id="hidden-invoice-preview" className="bg-white w-[210mm] min-h-[297mm] p-8">
                        <InvoicePreview order={orderForPdf} />
                    </div>
                </div>
            )}
        </>
    );
});
