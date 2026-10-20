export type PreventableStatus = "Preventable" | "Not Preventable" | "Unclassified";

export interface Subitem {
  name: string;
  quantity: number | null;
}

export interface Run {
  id: string;
  /** "Name" column (usually "Incoming form answer" for form submissions). */
  name: string;
  /** Short description of what was requested (the "Subitems" summary column). */
  description: string;
  /** Local wall-clock time, "YYYY-MM-DDTHH:mm". Null if missing. */
  date: string | null;
  technician: string;
  department: string;
  technicianAddress: string;
  supplyHouseName: string;
  supplyHouseAddress: string;
  /** e.g. ["Technician"], ["Supply House"], ["Technician", "Other"] */
  runTypes: string[];
  poNumber: string;
  runnerName: string;
  runnerEmail: string;
  startTrip: string | null;
  endTrip: string | null;
  durationText: string;
  durationMinutes: number | null;
  totalHours: number | null;
  mileage: number | null;
  preventable: PreventableStatus;
  preventableReason: string;
  subitems: Subitem[];
  /** True for runs created in the UI during this session (not persisted). */
  isDraft?: boolean;
  /** True for imported runs changed in the UI during this session (not persisted). */
  isEdited?: boolean;
  /** Epoch ms when the run timer was started in the UI; set while a run is in progress. */
  timerStartedAt?: number;
}

export interface RunData {
  runs: Run[];
  source: "excel" | "mock";
  sourceLabel: string;
}
