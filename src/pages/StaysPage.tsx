import { useMemo, useRef, useState } from "react";
import { useStays } from "@/hooks/useStays";
import { getCountryByCode, flagUrl } from "@/lib/countries";
import { stayDuration } from "@/lib/rule90-180";
import { CountryCombobox } from "@/components/CountryCombobox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Upload, Trash2, Pencil } from "lucide-react";
import { useStayModal } from "@/components/layout/AppLayout";

function formatDisplayDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function StaysPage() {
  const { stays, loading, removeSt, importCsv, exportCsv } = useStays();
  const { openEdit } = useStayModal();
  const [filter, setFilter] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!filter) return stays;
    return stays.filter((s) => s.country === filter);
  }, [stays, filter]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportErrors([]);
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const errors = await importCsv(text);
    if (errors.length > 0) setImportErrors(errors);
    e.target.value = "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading stays...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Stays</h1>
          <p className="text-sm text-muted-foreground">
            {stays.length} stay{stays.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9 sm:hidden" onClick={exportCsv} aria-label="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 sm:hidden"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Import CSV"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {importErrors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="py-3">
            <p className="text-sm font-medium text-destructive mb-1">Import errors:</p>
            <ul className="text-xs text-destructive space-y-0.5 list-disc list-inside">
              {importErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="max-w-xs">
        <CountryCombobox
          value={filter}
          onChange={setFilter}
          placeholder="Filter by country..."
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {stays.length === 0
              ? 'No stays yet. Click "Add stay" to get started.'
              : "No stays for the selected country."}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="space-y-2.5 sm:hidden">
            {filtered.map((s) => {
              const c = getCountryByCode(s.country);
              const days = stayDuration(s.entryDate, s.exitDate);
              return (
                <Card key={s.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Top row: country + actions */}
                    <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
                      <span className="flex items-center gap-2 font-medium text-sm">
                        <img
                          src={flagUrl(s.country)}
                          alt=""
                          className="h-4 w-5 rounded-sm object-cover"
                        />
                        {c?.name ?? s.country}
                      </span>
                      <div className="flex gap-0.5 -mr-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeSt(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Bottom row: dates + days badge */}
                    <div className="flex items-center gap-3 px-3.5 pb-3 text-xs text-muted-foreground">
                      <span className="text-foreground">
                        {formatDisplayDate(s.entryDate)}
                      </span>
                      <span className="text-muted-foreground/60">&rarr;</span>
                      <span className="text-foreground">
                        {formatDisplayDate(s.exitDate)}
                      </span>
                      <span className="ml-auto inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {days}d
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden sm:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const c = getCountryByCode(s.country);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <img
                            src={flagUrl(s.country)}
                            alt=""
                            className="h-4 w-5 rounded-sm object-cover"
                          />
                          {c?.name ?? s.country}
                        </span>
                      </TableCell>
                      <TableCell>{formatDisplayDate(s.entryDate)}</TableCell>
                      <TableCell>{formatDisplayDate(s.exitDate)}</TableCell>
                      <TableCell className="text-right font-medium">{stayDuration(s.entryDate, s.exitDate)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(s)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSt(s.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
