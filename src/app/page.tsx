import Dashboard from "@/components/Dashboard";
import { loadRunData } from "@/lib/parseRunBoard";

// Re-read the Excel file on every request so dropping in a new export just works.
export const dynamic = "force-dynamic";

export default function Page() {
  const data = loadRunData();
  return <Dashboard initialRuns={data.runs} source={data.source} sourceLabel={data.sourceLabel} />;
}
