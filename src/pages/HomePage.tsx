import { useMemo, useState } from "react";
import { useStays } from "@/context/StaysContext";
import {
  daysUsedToday,
  daysRemaining,
  nextPossibleEntry,
  hasOverstay,
  todayLocal,
} from "@/lib/rule90-180";
import { getCountryByCode, flagUrl } from "@/lib/countries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountryCombobox } from "@/components/CountryCombobox";
import { AlertTriangle, CalendarCheck, Clock } from "lucide-react";

function formatDisplayDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CountrySummaryCard({ code }: { code: string }) {
  const { stays } = useStays();
  const refDate = todayLocal();
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
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Days used</p>
            <p className="text-2xl font-bold">{used}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Remaining</p>
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

export default function HomePage() {
  const { stays, loading, countryCodes } = useStays();
  const [filter, setFilter] = useState("");
  const refDate = todayLocal();

  const displayCodes = useMemo(() => {
    if (filter) return [filter];
    return countryCodes;
  }, [filter, countryCodes]);

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

      <div className="max-w-xs">
        <CountryCombobox
          value={filter}
          onChange={setFilter}
          placeholder="Filter by country..."
        />
      </div>

      {displayCodes.length === 0 && stays.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No stays recorded yet. Click "Add stay" to get started.
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
          <CountrySummaryCard key={code} code={code} />
        ))}
      </div>

      {countryCodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">Countries:</span>
          {countryCodes.map((code) => {
            const c = getCountryByCode(code);
            return (
              <Badge key={code} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilter(code === filter ? "" : code)}>
                <img src={flagUrl(code)} alt="" className="h-3 w-4 rounded-sm object-cover" />
                {c?.name ?? code}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
