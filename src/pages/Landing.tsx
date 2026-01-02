import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

const Landing = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground animate-fade-in">
            {/* Navigation */}
            <header className="px-6 lg:px-8 h-20 flex items-center justify-between border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                        Invoice Genie
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login">
                        <Button variant="ghost" className="font-medium">
                            Log in
                        </Button>
                    </Link>
                    <Link to="/login">
                        <Button className="font-medium shadow-lg shadow-primary/20">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 lg:py-32 overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
                    <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-8">
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                            v2.0 Now Available
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                            Streamline Your Invoice <br /> Workflow Instantly
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                            The professional, offline-first invoicing solution for modern businesses.
                            Generate shipping labels, track orders via WhatsApp, and analyze growth.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link to="/login">
                                <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-xl shadow-primary/20 transition-transform hover:scale-105">
                                    Start Invoicing Free <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-20 bg-muted/30 border-y border-border/50">
                    <div className="container px-4 md:px-6">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
                                    <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                                <p className="text-muted-foreground">
                                    Generate professional PDF invoices and shipping labels in seconds using our streamlined editor.
                                </p>
                            </div>
                            <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6">
                                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">WhatsApp Integration</h3>
                                <p className="text-muted-foreground">
                                    Send automated tracking updates and invoices directly to your customers' WhatsApp with one click.
                                </p>
                            </div>
                            <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
                                    <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">100% Secure & Offline</h3>
                                <p className="text-muted-foreground">
                                    Your data never leaves your device. All customers and orders are stored locally in your browser database.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-8 border-t border-border/40 text-center text-muted-foreground">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} Invoice Genie. Built for growth.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
