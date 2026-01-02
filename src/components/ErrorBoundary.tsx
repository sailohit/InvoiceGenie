import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
                    <div className="bg-destructive/10 p-4 rounded-full mb-4">
                        <AlertCircle className="w-12 h-12 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        We encountered an error while loading this page.
                    </p>
                    <div className="bg-muted p-4 rounded-lg text-left font-mono text-xs mb-6 w-full max-w-lg overflow-auto border border-border">
                        {this.state.error?.toString()}
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="default"
                    >
                        Refresh Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
