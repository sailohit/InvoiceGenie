import { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Plus,
    Save,
    Printer,
    Search,
    History,
    FileText
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CommandMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    actions: {
        handleNew: () => void;
        handleSave: () => void;
        handlePrint: () => void;
        handleSearch: () => void;
    };
}

export const CommandMenu = ({ open, onOpenChange, actions }: CommandMenuProps) => {
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 overflow-hidden shadow-2xl max-w-[450px]">
                <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                    <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Command.Input
                            placeholder="Type a command or search..."
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                        <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>

                        <Command.Group heading="Suggestions">
                            <Command.Item onSelect={() => { actions.handleNew(); onOpenChange(false); }} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <Plus className="mr-2 h-4 w-4" />
                                <span>New Invoice</span>
                                <span className="ml-auto text-xs tracking-widest text-muted-foreground">Ctrl+N</span>
                            </Command.Item>
                            <Command.Item onSelect={() => { actions.handleSave(); onOpenChange(false); }} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <Save className="mr-2 h-4 w-4" />
                                <span>Save Order</span>
                                <span className="ml-auto text-xs tracking-widest text-muted-foreground">Ctrl+S</span>
                            </Command.Item>
                            <Command.Item onSelect={() => { actions.handlePrint(); onOpenChange(false); }} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <Printer className="mr-2 h-4 w-4" />
                                <span>Print / Export PDF</span>
                                <span className="ml-auto text-xs tracking-widest text-muted-foreground">Ctrl+P</span>
                            </Command.Item>
                            <Command.Item onSelect={() => { actions.handleSearch(); onOpenChange(false); }} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <History className="mr-2 h-4 w-4" />
                                <span>Search History</span>
                                <span className="ml-auto text-xs tracking-widest text-muted-foreground">Ctrl+F</span>
                            </Command.Item>
                        </Command.Group>

                        <Command.Separator />

                        <Command.Group heading="Navigation">
                            <Command.Item className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </DialogContent>
        </Dialog>
    );
};
