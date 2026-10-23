"use client";

import { useState, useMemo } from "react";
import { Plus, RefreshCcw, Truck, History, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ActiveBulkerSheet } from "./ActiveBulkerSheet";
import { BulkerMobileList } from "./BulkerMobileList";
import { UnactiveBulkerTable } from "./UnactiveBulkerTable";
import { BulkerMobileEditModal } from "./BulkerMobileEditModal";

import { useProfileQuery } from "@/lib/hooks/queries/useProfileQuery";
import { useBulkerEntriesQuery } from "@/lib/hooks/queries/useBulkerQuery";
import { useBulkerSSE } from "@/lib/hooks/useBulkerSSE";
import { QUERY_KEYS } from "@/lib/constants";
import type { BulkerEntry } from "@/lib/types/bulker";
import { AddBulkerEntryModal } from "./AddBulkerEntryModal";
import { UpdateBulkerStatusModal } from "./UpdateBulkerStatusModal";

export default function BulkerEntriesClient() {
  // Mount Real-Time Redis Pub/Sub SSE listener
  useBulkerSSE();

  const queryClient = useQueryClient();
  const { data: profile } = useProfileQuery();

  const userLabels = useMemo(() => {
    return new Set(
      (profile?.labels || []).map((l: string) => String(l).toUpperCase())
    );
  }, [profile]);

  const hasFullBulker =
    userLabels.has("BULKER") ||
    userLabels.has("ADMIN") ||
    userLabels.has("SUPERADMIN");
  const isViewer = !hasFullBulker && userLabels.has("BULKER-VIEWER");

  // Search State for Active Queue (unpaginated)
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BulkerEntry | null>(null);

  // Mobile Edit Modal state
  const [selectedMobileEntry, setSelectedMobileEntry] = useState<BulkerEntry | null>(null);
  const [isMobileEditOpen, setIsMobileEditOpen] = useState(false);

  const queryParams = {
    search: activeSearch || undefined,
  };

  const { data, isLoading, isFetching } = useBulkerEntriesQuery(queryParams);

  const entries = useMemo(() => data?.entries || [], [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
  };

  const handleRefresh = () => {
    setSearchInput("");
    setActiveSearch("");
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.all });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Bulker Entries
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time active dispatch queue and lifecycle status management.
          </p>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-[#121316] border border-border/80 p-1">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-white data-[state=active]:text-black text-xs font-medium px-4 gap-2"
          >
            Active
            {entries.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-mono data-[state=active]:bg-black/10 data-[state=active]:text-black">
                {entries.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="unactive"
            className="data-[state=active]:bg-white data-[state=active]:text-black text-xs font-medium px-4 gap-2"
          >
            Unactive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 m-0">
          {/* Active Queue Toolbar (suppressed when active queue is completely empty) */}
          {(entries.length > 0 || Boolean(activeSearch)) && (
            <div className="flex flex-wrap items-center gap-2">
              <form onSubmit={handleSearch} className="w-64">
                <Input
                  placeholder="Search active bulkers..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="bg-black/40 border-border text-white text-xs h-9 w-full"
                />
              </form>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isFetching}
                  title="Refresh Queue"
                  className="w-9 h-9 p-0 bg-black/40 border-border text-muted-foreground hover:text-white"
                >
                  <RefreshCcw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                  <span className="sr-only">Refresh</span>
                </Button>

                {!isViewer && (
                  <Button
                    size="icon"
                    onClick={() => setIsAddOpen(true)}
                    title="Add Bulker"
                    className="w-9 h-9 p-0 bg-white text-black hover:bg-zinc-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="sr-only">Add Bulker</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Desktop & Tablet Screen: Active Queue Sheet Table */}
          <div className="hidden md:block">
            <ActiveBulkerSheet
              entries={entries}
              isLoading={isLoading}
              isViewer={isViewer}
              isAdmin={false}
              onOpenStatusModal={(entry) => {
                setSelectedEntry(entry);
                setIsStatusOpen(true);
              }}
              emptyStateAction={
                !isViewer && !activeSearch ? (
                  <Button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-white text-black hover:bg-zinc-200 text-xs font-medium"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Bulker
                  </Button>
                ) : activeSearch ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="text-xs bg-transparent border-border text-white hover:bg-zinc-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Clear Search
                  </Button>
                ) : undefined
              }
              emptyStateTitle={
                activeSearch ? "No matching active bulkers found" : "No Active Bulkers Found"
              }
              emptyStateDescription={
                activeSearch
                  ? "No active trucks match your current search. Try clearing the search query."
                  : "No trucks are currently active in the plant or waiting queue."
              }
            />
          </div>

          {/* Mobile Screen: Compact List Pattern */}
          <div className="md:hidden">
            <BulkerMobileList
              entries={entries}
              isLoading={isLoading}
              isViewer={isViewer}
              onOpenEdit={(entry) => {
                setSelectedMobileEntry(entry);
                setIsMobileEditOpen(true);
              }}
              emptyStateAction={
                !isViewer && !activeSearch ? (
                  <Button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-white text-black hover:bg-zinc-200 text-xs font-medium"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Bulker
                  </Button>
                ) : activeSearch ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="text-xs bg-transparent border-border text-white hover:bg-zinc-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Clear Search
                  </Button>
                ) : undefined
              }
              emptyStateTitle={
                activeSearch ? "No matching active bulkers found" : "No Active Bulkers Found"
              }
              emptyStateDescription={
                activeSearch
                  ? "No active trucks match your current search. Try clearing the search query."
                  : "No trucks are currently active in the plant or waiting queue."
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="unactive" className="m-0">
          <UnactiveBulkerTable />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddBulkerEntryModal isOpen={isAddOpen} onClose={setIsAddOpen} />

      <UpdateBulkerStatusModal
        isOpen={isStatusOpen}
        onClose={setIsStatusOpen}
        selectedEntry={selectedEntry}
        isAdmin={false}
      />

      <BulkerMobileEditModal
        isOpen={isMobileEditOpen}
        onClose={setIsMobileEditOpen}
        entry={selectedMobileEntry}
        isViewer={isViewer}
      />
    </div>
  );
}
