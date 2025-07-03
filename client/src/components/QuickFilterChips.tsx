import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  key: string;
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  maxVisible?: number;
}

export interface ActiveFilter {
  groupId: string;
  key: string;
  value: string;
  label: string;
}

interface QuickFilterChipsProps {
  filterGroups: FilterGroup[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  onClearAll: () => void;
  className?: string;
}

export function QuickFilterChips({
  filterGroups,
  activeFilters,
  onFilterChange,
  onClearAll,
  className
}: QuickFilterChipsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const addFilter = (groupId: string, option: FilterOption) => {
    // Remove any existing filter from the same group (single selection per group)
    const filteredExisting = activeFilters.filter(f => f.groupId !== groupId);
    const newFilter: ActiveFilter = {
      groupId,
      key: option.key,
      value: option.value,
      label: option.label
    };
    onFilterChange([...filteredExisting, newFilter]);
  };

  const removeFilter = (filterToRemove: ActiveFilter) => {
    const updated = activeFilters.filter(
      f => !(f.groupId === filterToRemove.groupId && f.key === filterToRemove.key)
    );
    onFilterChange(updated);
  };

  const isFilterActive = (groupId: string, optionKey: string) => {
    return activeFilters.some(f => f.groupId === groupId && f.key === optionKey);
  };

  const getVisibleOptions = (group: FilterGroup) => {
    const maxVisible = group.maxVisible || 8;
    const isExpanded = expandedGroups.has(group.id);
    return isExpanded ? group.options : group.options.slice(0, maxVisible);
  };

  const hasMoreOptions = (group: FilterGroup) => {
    const maxVisible = group.maxVisible || 8;
    return group.options.length > maxVisible;
  };

  return (
    <Card className={cn("p-4 bg-white/10 backdrop-blur-md border-white/20", className)}>
      <div className="space-y-4">
        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Filter className="h-4 w-4" />
              Active Filters:
            </div>
            {activeFilters.map((filter) => (
              <Badge
                key={`${filter.groupId}-${filter.key}`}
                variant="secondary"
                className="bg-blue-500/20 text-white border-blue-400/30 hover:bg-blue-500/30"
              >
                {filter.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-red-500/20"
                  onClick={() => removeFilter(filter)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Filter Groups */}
        <div className="space-y-3">
          {filterGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">{group.label}</h4>
                {hasMoreOptions(group) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroupExpansion(group.id)}
                    className="text-white/70 hover:text-white hover:bg-white/10 h-6 px-2"
                  >
                    {expandedGroups.has(group.id) ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show More
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {getVisibleOptions(group).map((option) => {
                  const isActive = isFilterActive(group.id, option.key);
                  return (
                    <Badge
                      key={option.key}
                      variant={isActive ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all hover:scale-105",
                        isActive
                          ? "bg-white text-black hover:bg-white/90"
                          : "bg-white/5 text-white border-white/30 hover:bg-white/10 hover:border-white/50"
                      )}
                      onClick={() => {
                        if (isActive) {
                          removeFilter({
                            groupId: group.id,
                            key: option.key,
                            value: option.value,
                            label: option.label
                          });
                        } else {
                          addFilter(group.id, option);
                        }
                      }}
                    >
                      {option.label}
                      {option.count !== undefined && (
                        <span className={cn(
                          "ml-1 text-xs",
                          isActive ? "text-black/70" : "text-white/70"
                        )}>
                          ({option.count})
                        </span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Hook for managing filter state
export function useQuickFilters() {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  const getFilterValue = (groupId: string): string | null => {
    const filter = activeFilters.find(f => f.groupId === groupId);
    return filter ? filter.value : null;
  };

  const hasActiveFilters = activeFilters.length > 0;

  // Generate SQL WHERE conditions based on active filters
  const generateWhereConditions = (): string => {
    if (activeFilters.length === 0) return "";

    const conditions: string[] = [];
    
    activeFilters.forEach(filter => {
      switch (filter.groupId) {
        case "stations":
          conditions.push(`station = '${filter.value.replace(/'/g, "''")}'`);
          break;
        case "commodities":
          conditions.push(`commodity = '${filter.value.replace(/'/g, "''")}'`);
          break;
        case "commodity_types":
          conditions.push(`comm_type = '${filter.value.replace(/'/g, "''")}'`);
          break;
        case "states":
          conditions.push(`state = '${filter.value.replace(/'/g, "''")}'`);
          break;
        case "wagon_types":
          conditions.push(`type = '${filter.value.replace(/'/g, "''")}'`);
          break;
        case "date_ranges":
          // Handle preset date ranges
          const now = new Date();
          let dateCondition = "";
          
          switch (filter.value) {
            case "last_7_days":
              const last7Days = new Date(now);
              last7Days.setDate(now.getDate() - 7);
              dateCondition = `p_date >= '${last7Days.toISOString().split('T')[0]}'`;
              break;
            case "last_30_days":
              const last30Days = new Date(now);
              last30Days.setDate(now.getDate() - 30);
              dateCondition = `p_date >= '${last30Days.toISOString().split('T')[0]}'`;
              break;
            case "current_month":
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              dateCondition = `p_date >= '${startOfMonth.toISOString().split('T')[0]}'`;
              break;
            case "last_month":
              const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
              dateCondition = `p_date >= '${startOfLastMonth.toISOString().split('T')[0]}' AND p_date <= '${endOfLastMonth.toISOString().split('T')[0]}'`;
              break;
          }
          
          if (dateCondition) {
            conditions.push(dateCondition);
          }
          break;
      }
    });

    return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  };

  return {
    activeFilters,
    setActiveFilters,
    clearAllFilters,
    getFilterValue,
    hasActiveFilters,
    generateWhereConditions
  };
}