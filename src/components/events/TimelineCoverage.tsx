import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";
import { Plus } from "lucide-react";

interface TimelineCoverageProps {
  turnoId: string;
  onFillGap: (gapStart: string, gapEnd: string) => void;
  onSplitTurno?: (splitTime: string) => void;
}

export const TimelineCoverage: React.FC<TimelineCoverageProps> = ({
  turnoId,
  onFillGap,
  onSplitTurno,
}) => {
  const getTimelineCoverage = useAppStore((s) => s.getTimelineCoverage);
  const getGaps = useAppStore((s) => s.getGaps);
  
  const coverage = getTimelineCoverage(turnoId);
  const gaps = getGaps(turnoId);

  const getCoveragePercentage = () => {
    if (coverage.intervals.length === 0) return 0;
    
    const totalIntervals = coverage.intervals.length;
    const coveredIntervals = coverage.intervals.filter(
      (interval) => interval.coverage >= interval.required
    ).length;
    
    return Math.round((coveredIntervals / totalIntervals) * 100);
  };

  const getCoverageColor = (interval: { coverage: number; required: number }) => {
    if (interval.coverage === 0) return "bg-destructive";
    if (interval.coverage < interval.required) return "bg-warning";
    return "bg-success";
  };

  const formatTimeRange = (start: string, end: string) => {
    return `${start}–${end}`;
  };

  const getCoverageSegments = () => {
    const segments: string[] = [];
    let currentStart: string | null = null;
    let currentCoverage: number | null = null;
    let currentRequired: number | null = null;

    coverage.intervals.forEach((interval, index) => {
      if (currentCoverage === interval.coverage && currentRequired === interval.required) {
        // Continue current segment
        return;
      }

      // End previous segment
      if (currentStart !== null && currentCoverage !== null && currentRequired !== null) {
        const prevInterval = coverage.intervals[index - 1];
        segments.push(`${formatTimeRange(currentStart, prevInterval.end)} ${currentCoverage}/${currentRequired}`);
      }

      // Start new segment
      currentStart = interval.start;
      currentCoverage = interval.coverage;
      currentRequired = interval.required;
    });

    // End final segment
    if (currentStart !== null && currentCoverage !== null && currentRequired !== null && coverage.intervals.length > 0) {
      const lastInterval = coverage.intervals[coverage.intervals.length - 1];
      segments.push(`${formatTimeRange(currentStart, lastInterval.end)} ${currentCoverage}/${currentRequired}`);
    }

    return segments;
  };

  return (
    <div className="space-y-3">
      {/* Timeline bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden flex">
          {coverage.intervals.map((interval, index) => (
            <div
              key={index}
              className={cn(
                "h-full transition-colors",
                getCoverageColor(interval)
              )}
              style={{
                width: `${100 / coverage.intervals.length}%`,
              }}
              title={`${interval.start}-${interval.end}: ${interval.coverage}/${interval.required} operatori`}
            />
          ))}
        </div>
        
        <Badge 
          variant={getCoveragePercentage() >= 100 ? "default" : getCoveragePercentage() > 0 ? "secondary" : "destructive"}
          className="ml-2"
        >
          Copertura: {getCoveragePercentage()}%
        </Badge>
      </div>

      {/* Coverage details */}
      <div className="text-sm text-muted-foreground">
        {getCoverageSegments().join(" • ")}
      </div>

      {/* Gap filling buttons */}
      {gaps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {gaps.map((gap, index) => (
            <Button
              key={index}
              size="sm"
              variant="outline"
              onClick={() => onFillGap(gap.start, gap.end)}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Riempi {formatTimeRange(gap.start, gap.end)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};