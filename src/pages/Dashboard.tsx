import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, Package, TrendingUp, Loader2, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

const Dashboard = () => {
    const orders = useLiveQuery(() => db.orders.orderBy('orderDate').toArray());
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [selectedMonth, setSelectedMonth] = useState<string>("all");

    // Memoize the filtering logic
    const { filteredOrders, availableYears } = useMemo(() => {
        if (!orders) return { filteredOrders: [], availableYears: [] };

        // Get unique years
        const years = Array.from(new Set(orders.map(o => new Date(o.orderDate).getFullYear()))).sort((a, b) => b - a);

        let filtered = orders;

        if (selectedYear !== "all") {
            filtered = filtered.filter(o => new Date(o.orderDate).getFullYear().toString() === selectedYear);
        }

        if (selectedMonth !== "all") {
            filtered = filtered.filter(o => new Date(o.orderDate).getMonth().toString() === selectedMonth);
        }

        return { filteredOrders: filtered, availableYears: years };
    }, [orders, selectedYear, selectedMonth]);

    if (!orders) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
            </div>
        );
    }

    // Calculate metrics based on filtered data
    const totalRevenue = filteredOrders.reduce((sum, order) => {
        const qty = Number(order.quantity) || 0;
        const price = Number(order.unitPrice) || 0;
        const shipping = Number(order.shippingCharges) || 0;
        return sum + (qty * price) + shipping;
    }, 0);

    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Prepare chart data (Group by Date)
    const salesByDate = filteredOrders.reduce((acc, order) => {
        const date = order.orderDate;
        const qty = Number(order.quantity) || 0;
        const price = Number(order.unitPrice) || 0;
        const shipping = Number(order.shippingCharges) || 0;
        const total = (qty * price) + shipping;

        if (!acc[date]) {
            acc[date] = { date, sales: 0, orders: 0 };
        }
        acc[date].sales += total;
        acc[date].orders += 1;
        return acc;
    }, {} as Record<string, { date: string, sales: number, orders: number }>);

    const chartData = Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date));
    // Determine slice for chart - if looking at full history maybe show last 30? 
    // If specific month, show all days.
    const displayChartData = selectedMonth === 'all' && selectedYear === 'all'
        ? chartData.slice(-30) // Show last 30 days default
        : chartData;

    const months = [
        { value: "0", label: "January" },
        { value: "1", label: "February" },
        { value: "2", label: "March" },
        { value: "3", label: "April" },
        { value: "4", label: "May" },
        { value: "5", label: "June" },
        { value: "6", label: "July" },
        { value: "7", label: "August" },
        { value: "8", label: "September" },
        { value: "9", label: "October" },
        { value: "10", label: "November" },
        { value: "11", label: "December" },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Overview of your business performance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[120px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {availableYears.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Months</SelectItem>
                            {months.map(month => (
                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <Wallet className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            {selectedMonth !== 'all' || selectedYear !== 'all' ? 'Filtered period' : '+ from all time'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">Orders (Filtered)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{Math.round(avgOrderValue).toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">Per order average</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px] w-full">
                        {displayChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={displayChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return `${date.getDate()}/${date.getMonth() + 1}`;
                                        }}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₹${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                                    />
                                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No data available for selected period
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

import { ErrorBoundary } from '@/components/ErrorBoundary';

const DashboardWithBoundary = () => (
    <ErrorBoundary>
        <Dashboard />
    </ErrorBoundary>
);

export default DashboardWithBoundary;
