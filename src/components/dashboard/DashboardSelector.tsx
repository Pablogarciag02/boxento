import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Export the Dashboard interface so it can be used elsewhere
export interface Dashboard {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
}

interface DashboardSelectorProps {
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  onDashboardChange: (dashboardId: string) => void;
  onCreateDashboard: (name: string) => void;
  onRenameDashboard: (id: string, name: string) => void;
  onDeleteDashboard: (id: string) => void;
}

export function DashboardSelector({
  dashboards,
  currentDashboard,
  onDashboardChange,
  onCreateDashboard,
  onRenameDashboard,
  onDeleteDashboard
}: DashboardSelectorProps) {
  const [isCreatingDashboard, setIsCreatingDashboard] = useState(false);
  const [isRenamingDashboard, setIsRenamingDashboard] = useState(false);
  const [isDeletingDashboard, setIsDeletingDashboard] = useState(false);
  const [dashboardName, setDashboardName] = useState("");
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleCreateSubmit = () => {
    if (dashboardName.trim()) {
      onCreateDashboard(dashboardName.trim());
      setDashboardName("");
      setIsCreatingDashboard(false);
    }
  };

  const handleRenameSubmit = () => {
    if (dashboardName.trim() && selectedDashboardId) {
      onRenameDashboard(selectedDashboardId, dashboardName.trim());
      setDashboardName("");
      setSelectedDashboardId(null);
      setIsRenamingDashboard(false);
    }
  };

  const handleDeleteSubmit = () => {
    if (selectedDashboardId) {
      onDeleteDashboard(selectedDashboardId);
      setSelectedDashboardId(null);
      setIsDeletingDashboard(false);
    }
  };

  const startRenaming = (dashboard: Dashboard) => {
    setDashboardName(dashboard.name);
    setSelectedDashboardId(dashboard.id);
    setIsRenamingDashboard(true);
    setOpen(false);
  };

  const startDeleting = (dashboard: Dashboard) => {
    setSelectedDashboardId(dashboard.id);
    setIsDeletingDashboard(true);
    setOpen(false);
  };

  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="flex items-center gap-2 py-5 pl-2 pr-2 h-auto"
          >
            <div className="flex items-center gap-3">
              <div className="bg-black text-white w-12 h-12 flex items-center justify-center rounded-md">
                <span className="text-lg">{currentDashboard?.name?.charAt(0) || "B"}</span>
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-lg font-medium">{currentDashboard?.name || "Dashboard"}</span>
                <span className="text-sm text-muted-foreground">
                  {currentDashboard?.id === 'dashboard1' ? 'Personal' : 
                   currentDashboard?.id === 'dashboard2' ? 'Work' : 
                   currentDashboard?.id === 'dashboard3' ? 'Project' : 'Dashboard'}
                </span>
              </div>
            </div>
            {open ? (
              <ChevronUp className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            ) : (
              <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0">
          <Command>
            <CommandInput placeholder="Search dashboards..." />
            <CommandList>
              <CommandEmpty>No dashboard found.</CommandEmpty>
              <CommandGroup>
                {dashboards.map((dashboard) => (
                  <CommandItem
                    key={dashboard.id}
                    value={dashboard.id}
                    onSelect={(value) => {
                      onDashboardChange(value);
                      setOpen(false);
                    }}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-800 mr-2 flex items-center justify-center">
                        <span>{dashboard.name.charAt(0)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span>{dashboard.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {dashboard.id === 'dashboard1' ? 'Personal' : 
                           dashboard.id === 'dashboard2' ? 'Work' : 
                           dashboard.id === 'dashboard3' ? 'Project' : 'Dashboard'}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          currentDashboard?.id === dashboard.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                    <div className="flex">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRenaming(dashboard);
                        }}
                      >
                        <span className="sr-only">Rename</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          startDeleting(dashboard);
                        }}
                      >
                        <span className="sr-only">Delete</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </Button>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem 
                  onSelect={() => {
                    setIsCreatingDashboard(true);
                    setOpen(false);
                  }}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new dashboard
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Dashboard Dialog */}
      <Dialog open={isCreatingDashboard} onOpenChange={setIsCreatingDashboard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Dashboard</DialogTitle>
            <DialogDescription>
              Enter a name for your new dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Dashboard name</Label>
              <Input
                id="dashboard-name"
                placeholder="My Dashboard"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingDashboard(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dashboard Dialog */}
      <Dialog open={isRenamingDashboard} onOpenChange={setIsRenamingDashboard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Dashboard</DialogTitle>
            <DialogDescription>
              Enter a new name for this dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dashboard-rename">Dashboard name</Label>
              <Input
                id="dashboard-rename"
                placeholder="My Dashboard"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenamingDashboard(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dashboard Confirmation Dialog */}
      <Dialog open={isDeletingDashboard} onOpenChange={setIsDeletingDashboard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dashboard</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this dashboard? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeletingDashboard(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 