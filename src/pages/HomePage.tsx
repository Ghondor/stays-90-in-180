import { useMemo, useState } from "react";
import { subDays, format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Area,
  AreaChart,
} from "recharts";
import { useStays } from "@/hooks/useStays";
import {
  daysUsedToday,
  daysRemaining,
  nextPossibleEntry,
  hasOverstay,
  todayLocal,
} from "@/lib/rule90-180";
import { ZONE_SCHENGEN, isSchengen } from "@/lib/zones";
import { getCountryByCode, flagUrl } from "@/lib/countries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountryCombobox } from "@/components/CountryCombobox";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AlertTriangle, CalendarCheck, Clock, Shield } from "lucide-react";
import type { Stay } from "@/lib/rule90-180";

function formatDisplayDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---- Country Summary Card ----

function CountrySummaryCard({
  code,
  refDate,
}: {
  code: string;
  refDate: string;
}) {
  const { stays } = useStays();
  const used = daysUsedToday(stays, code, refDate);
  const remaining = daysRemaining(stays, code, refDate);
  const nextEntry = nextPossibleEntry(stays, code, refDate);
  const overstay = hasOverstay(stays, code);
  const country = getCountryByCode(code);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <img
            src={flagUrl(code, 40)}
            alt=""
            className="h-5 w-6 rounded-sm object-cover"
          />
          {country?.name ?? code.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Days used
            </p>
            <p className="text-2xl font-bold">{used}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Remaining
            </p>
            <p className="text-2xl font-bold text-primary">{remaining}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, (used / 90) * 100)}%` }}
          />
        </div>

        {used < 90 && (
          <p className="flex items-center gap-1.5 text-sm text-success">
            <CalendarCheck className="h-4 w-4" />
            Within your 90-day limit
          </p>
        )}

        {used >= 90 && nextEntry && (
          <p className="flex items-center gap-1.5 text-sm text-warning">
            <Clock className="h-4 w-4" />
            Can enter again: <strong>{formatDisplayDate(nextEntry)}</strong>
          </p>
        )}

        {overstay && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Possible overstay detected
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Schengen Summary Card ----

function SchengenSummaryCard({ refDate }: { refDate: string }) {
  const { stays } = useStays();
  const used = daysUsedToday(stays, ZONE_SCHENGEN, refDate);
  const remaining = daysRemaining(stays, ZONE_SCHENGEN, refDate);
  const nextEntry = nextPossibleEntry(stays, ZONE_SCHENGEN, refDate);
  const overstay = hasOverstay(stays, ZONE_SCHENGEN);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          Schengen Area
        </CardTitle>
        <CardDescription>
          Combined 90-in-180 across all Schengen states
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Days used
            </p>
            <p className="text-2xl font-bold">{used}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Remaining
            </p>
            <p className="text-2xl font-bold text-primary">{remaining}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, (used / 90) * 100)}%` }}
          />
        </div>

        {used < 90 && (
          <p className="flex items-center gap-1.5 text-sm text-success">
            <CalendarCheck className="h-4 w-4" />
            Within your 90-day Schengen limit
          </p>
        )}

        {used >= 90 && nextEntry && (
          <p className="flex items-center gap-1.5 text-sm text-warning">
            <Clock className="h-4 w-4" />
            Can re-enter Schengen:{" "}
            <strong>{formatDisplayDate(nextEntry)}</strong>
          </p>
        )}

        {overstay && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Possible Schengen overstay detected
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Chart data helpers ----

/** Filter stays overlapping a date range */
function staysInRange(stays: Stay[], from: Date, to: Date): Stay[] {
  return stays.filter((s) => {
    const entry = parseISO(s.entryDate);
    const exit = parseISO(s.exitDate);
    return exit >= from && entry <= to;
  });
}

/** Days per country data for bar chart */
function daysPerCountryData(
  stays: Stay[],
  from: Date,
  to: Date
): { country: string; code: string; days: number; isSchengen: boolean }[] {
  const filtered = staysInRange(stays, from, to);
  const map = new Map<string, number>();
  for (const s of filtered) {
    const entry = parseISO(s.entryDate);
    const exit = parseISO(s.exitDate);
    // Clamp to range
    const clampedEntry = entry < from ? from : entry;
    const clampedExit = exit > to ? to : exit;
    const days =
      Math.floor(
        (clampedExit.getTime() - clampedEntry.getTime()) / 86400000
      ) + 1;
    map.set(s.country, (map.get(s.country) || 0) + days);
  }
  return Array.from(map.entries())
    .map(([code, days]) => ({
      country: getCountryByCode(code)?.name ?? code.toUpperCase(),
      code,
      days,
      isSchengen: isSchengen(code),
    }))
    .sort((a, b) => b.days - a.days);
}

/** Monthly timeline data */
function monthlyTimelineData(
  stays: Stay[],
  from: Date,
  to: Date
): { month: string; days: number }[] {
  const months = eachMonthOfInterval({ start: from, end: to });
  return months.map((m) => {
    const monthStart = startOfMonth(m);
    const monthEnd = endOfMonth(m);
    let totalDays = 0;
    for (const s of stays) {
      const entry = parseISO(s.entryDate);
      const exit = parseISO(s.exitDate);
      if (exit < monthStart || entry > monthEnd) continue;
      const clampedEntry = entry < monthStart ? monthStart : entry;
      const clampedExit = exit > monthEnd ? monthEnd : exit;
      totalDays +=
        Math.floor(
          (clampedExit.getTime() - clampedEntry.getTime()) / 86400000
        ) + 1;
    }
    return {
      month: format(m, "MMM yy"),
      days: totalDays,
    };
  });
}

// ---- Chart configs ----

const barChartConfig = {
  days: {
    label: "Days",
    color: "oklch(0.55 0.17 40)",
  },
} satisfies ChartConfig;

const timelineChartConfig = {
  days: {
    label: "Days Stayed",
    color: "oklch(0.55 0.17 40)",
  },
} satisfies ChartConfig;

const gaugeChartConfig = {
  used: {
    label: "Days Used",
    color: "oklch(0.55 0.17 40)",
  },
} satisfies ChartConfig;

// ---- Main page ----

export default function HomePage() {
  const { stays, loading, countryCodes } = useStays();
  const [filter, setFilter] = useState("");
  const today = todayLocal();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 180),
    to: new Date(),
  });

  // Use end of selected range for "as of" date, or today
  const refDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : today;

  const displayCodes = useMemo(() => {
    if (filter) return [filter];
    return countryCodes;
  }, [filter, countryCodes]);

  const hasSchengenStays = useMemo(() => {
    return stays.some((s) => isSchengen(s.country));
  }, [stays]);

  // Chart data
  const rangeFrom = useMemo(
    () => dateRange?.from ?? subDays(new Date(), 180),
    [dateRange?.from]
  );
  const rangeTo = useMemo(
    () => dateRange?.to ?? new Date(),
    [dateRange?.to]
  );

  const barData = useMemo(
    () => daysPerCountryData(stays, rangeFrom, rangeTo),
    [stays, rangeFrom, rangeTo]
  );

  const timelineData = useMemo(
    () => monthlyTimelineData(stays, rangeFrom, rangeTo),
    [stays, rangeFrom, rangeTo]
  );

  const schengenUsed = useMemo(
    () => daysUsedToday(stays, ZONE_SCHENGEN, refDate),
    [stays, refDate]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading stays...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          90-in-180 overview as of {formatDisplayDate(refDate)}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-xs">
          <CountryCombobox
            value={filter}
            onChange={setFilter}
            placeholder="Filter by country..."
          />
        </div>
        <div className="w-full sm:max-w-sm">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Select date range..."
          />
        </div>
      </div>

      {/* Schengen Card (if applicable) */}
      {hasSchengenStays && !filter && (
        <SchengenSummaryCard refDate={refDate} />
      )}

      {displayCodes.length === 0 && stays.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No stays recorded yet. Click &quot;Add stay&quot; to get started.
          </CardContent>
        </Card>
      )}

      {displayCodes.length === 0 && stays.length > 0 && filter && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No stays for the selected country.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayCodes.map((code) => (
          <CountrySummaryCard key={code} code={code} refDate={refDate} />
        ))}
      </div>

      {countryCodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">
            Countries:
          </span>
          {countryCodes.map((code) => {
            const c = getCountryByCode(code);
            return (
              <Badge
                key={code}
                variant="secondary"
                className="gap-1 cursor-pointer"
                onClick={() => setFilter(code === filter ? "" : code)}
              >
                <img
                  src={flagUrl(code)}
                  alt=""
                  className="h-3 w-4 rounded-sm object-cover"
                />
                {c?.name ?? code}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Charts */}
      {stays.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Statistics</h2>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Days per Country bar chart */}
            {barData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Days per Country</CardTitle>
                  <CardDescription>
                    Total days stayed in selected range
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={barChartConfig}
                    className="aspect-auto w-full"
                    style={{ height: Math.max(150, barData.length * 50) }}
                  >
                    <BarChart
                      accessibilityLayer
                      data={barData}
                      layout="vertical"
                      margin={{ left: 0, right: 16 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <YAxis
                        dataKey="country"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        fontSize={11}
                        tickFormatter={(v: string) =>
                          v.length > 10 ? v.slice(0, 10) + "…" : v
                        }
                      />
                      <XAxis type="number" hide />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            nameKey="country"
                            hideLabel
                          />
                        }
                      />
                      <Bar
                        dataKey="days"
                        fill="var(--color-days)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* 90-Day Schengen Gauge */}
            {hasSchengenStays && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Schengen 90-Day Usage
                  </CardTitle>
                  <CardDescription>
                    Current usage of your 90-day Schengen allowance
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ChartContainer
                    config={gaugeChartConfig}
                    className="aspect-square w-full max-w-[250px]"
                  >
                    <RadialBarChart
                      data={[
                        {
                          name: "Used",
                          used: schengenUsed,
                          fill: "var(--color-used)",
                        },
                      ]}
                      startAngle={180}
                      endAngle={0}
                      innerRadius="70%"
                      outerRadius="100%"
                      barSize={20}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 90]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        background
                        dataKey="used"
                        cornerRadius={10}
                        angleAxisId={0}
                      />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground"
                      >
                        <tspan
                          x="50%"
                          dy="-0.3em"
                          className="text-3xl font-bold"
                        >
                          {schengenUsed}
                        </tspan>
                        <tspan
                          x="50%"
                          dy="1.4em"
                          className="text-sm fill-muted-foreground"
                        >
                          of 90 days
                        </tspan>
                      </text>
                    </RadialBarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Monthly Timeline */}
          {timelineData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Timeline</CardTitle>
                <CardDescription>
                  Days stayed per month over the selected range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={timelineChartConfig}
                  className="aspect-auto h-[250px] w-full sm:aspect-video sm:h-auto"
                >
                  <AreaChart
                    accessibilityLayer
                    data={timelineData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      width={40}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <defs>
                      <linearGradient
                        id="fillDays"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-days)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-days)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="days"
                      stroke="var(--color-days)"
                      fill="url(#fillDays)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
