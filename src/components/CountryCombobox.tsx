import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { COUNTRIES, getCountryByCode, flagUrl } from "@/lib/countries";

interface CountryComboboxProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}

export function CountryCombobox({
  value,
  onChange,
  placeholder = "Select country...",
}: CountryComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? getCountryByCode(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <img
                src={flagUrl(selected.code)}
                alt=""
                className="h-4 w-5 rounded-sm object-cover"
                loading="lazy"
              />
              {selected.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search countries..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((c) => (
                <CommandItem
                  key={c.code}
                  value={c.name}
                  onSelect={() => {
                    onChange(c.code === value ? "" : c.code);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <img
                    src={flagUrl(c.code)}
                    alt=""
                    className="h-4 w-5 rounded-sm object-cover"
                    loading="lazy"
                  />
                  <span className="flex-1">{c.name}</span>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === c.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
