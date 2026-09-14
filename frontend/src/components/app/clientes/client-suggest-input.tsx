"use client";

import * as React from "react";
import { listClients, type Client } from "@/components/app/api/clients";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 320;
const SUGGESTION_LIMIT = 5;

type Field = "fullName" | "email";

type Props = {
  id: string;
  field: Field;
  businessId: string | null;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
};

export function ClientSuggestInput({
  id,
  field,
  businessId,
  value,
  onChange,
  placeholder,
  type = "text",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const skipSuggestRef = React.useRef(false);

  React.useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  React.useEffect(() => {
    if (!businessId) return;
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false;
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const q = value.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      listClients({
        businessId,
        fullName: field === "fullName" ? q : undefined,
        email: field === "email" ? q : undefined,
        sortBy: "name",
        sortDir: "asc",
        page: 1,
        pageSize: SUGGESTION_LIMIT,
      })
        .then((res) => {
          setSuggestions(res.items);
          setOpen(res.items.length > 0);
          setActiveIndex(-1);
        })
        .catch(() => {
          setSuggestions([]);
          setOpen(false);
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [businessId, field, value]);

  function pick(client: Client) {
    skipSuggestRef.current = true;
    const next =
      field === "fullName" ? client.fullName : (client.email ?? "").trim();
    onChange(next);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <Input
        id={id}
        type={type}
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
      />
      {open ? (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-popover py-1 text-sm shadow-md"
        >
          {suggestions.map((client, index) => {
            const primary =
              field === "fullName"
                ? client.fullName
                : (client.email ?? "Sin correo");
            const secondary =
              field === "fullName"
                ? client.email
                : client.fullName;
            return (
              <li key={client.id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-accent",
                    index === activeIndex && "bg-accent",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(client)}
                >
                  <span className="font-medium">{primary}</span>
                  {secondary ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {secondary}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
          {loading ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">Buscando…</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
