import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, Trash2, AlertTriangle, Database } from "lucide-react";
import { exportData, importData, factoryReset } from "@/utils/dataUtils";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminData = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        const success = await exportData();
        if (success) toast.success("Backup downloaded successfully");
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (confirm("This will merge the imported data with your current data. Existing records with same IDs will be updated. Continue?")) {
            try {
                await importData(file, 'merge');
                toast.success("Data imported successfully");
                // Refresh/Reload might be needed? LiveQueries should handle it essentially.
                // A reload ensures all app states (contexts) are fresh.
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                toast.error("Failed to import data");
            }
        }
        // Reset input
        e.target.value = "";
    };

    const handleReset = async () => {
        if (confirm("WARNING: This will delete ALL Orders, Customers, Products, and Settings. User accounts will be preserved. This action CANNOT be undone. Are you sure?")) {
            const success = await factoryReset();
            if (success) {
                toast.success("Factory reset complete");
                setTimeout(() => window.location.reload(), 1000);
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Data Management</h2>
                <p className="text-muted-foreground">Backup, restore, or reset your application data.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Backup Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-green-500" />
                            Backup Data
                        </CardTitle>
                        <CardDescription>
                            Create a complete JSON backup of all your orders, customers, and settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleExport} className="w-full">
                            Download Backup
                        </Button>
                    </CardContent>
                </Card>

                {/* Restore Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-blue-500" />
                            Restore Data
                        </CardTitle>
                        <CardDescription>
                            Import data from a backup file. This will merge with existing data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                        <Button variant="outline" onClick={handleImportClick} className="w-full">
                            Select Backup File
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Irreversible actions that affect your entire dataset.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-background">
                        <div>
                            <h4 className="font-semibold text-sm">Factory Reset</h4>
                            <p className="text-xs text-muted-foreground">Clears all business data. Keeps admin accounts.</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={handleReset}>
                            <Trash2 className="h-4 w-4 mr-2" /> Reset All
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>Local-First Architecture</AlertTitle>
                <AlertDescription>
                    Invoice Genie stores all data locally in your browser (IndexedDB).
                    Regular backups are recommended to prevent data loss in case of browser cache clearing or device issues.
                </AlertDescription>
            </Alert>
        </div>
    );
};

export default AdminData;
