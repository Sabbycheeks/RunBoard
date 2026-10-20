"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  departments: string[];
  onClose: () => void;
  onSave: (departments: string[]) => void;
}

/** Add / remove department options. Changes last until the page is refreshed. */
export default function DepartmentManager({ departments, onClose, onSave }: Props) {
  const [list, setList] = useState(departments);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    // Capture phase + stopImmediatePropagation so Escape closes only this dialog,
    // not the run form it may be opened from.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (list.some((d) => d.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" is already in the list.`);
      return;
    }
    setList((cur) => [...cur, name]);
    setDraft("");
    setError("");
    input.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dept-title"
        className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-sm sm:rounded-2xl"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 id="dept-title" className="text-base font-semibold text-slate-900">
            Edit Departments
          </h2>
          <p className="text-xs text-slate-500">Prototype only — changes reset when the page reloads.</p>
        </div>

        <div className="border-b border-slate-200 px-5 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
            className="flex gap-2"
          >
            <input
              ref={input}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              placeholder="New department name"
              aria-label="New department name"
              maxLength={60}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Add
            </button>
          </form>
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto px-5">
          {list.map((d) => (
            <li key={d} className="flex items-center justify-between gap-2 py-2">
              <span className="text-sm text-slate-800">{d}</span>
              <button
                type="button"
                onClick={() => setList((cur) => cur.filter((x) => x !== d))}
                disabled={list.length === 1}
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:invisible"
                aria-label={`Remove ${d}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(list)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
