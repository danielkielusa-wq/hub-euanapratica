import { InfoBar } from "./InfoBar";
import { StrategicKPIs } from "./StrategicKPIs";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { Charts } from "./Charts";
import { HotLeads } from "./HotLeads";
import { OpportunitiesAndAlerts } from "./OpportunitiesAndAlerts";
import { TalkingPoints } from "./TalkingPoints";
import { BottomSections } from "./BottomSections";

export function Dashboard() {
  return (
    <div className="animate-in fade-in duration-500">
      <InfoBar />
      <StrategicKPIs />
      <ExecutiveSummary />
      <Charts />
      <HotLeads />
      <OpportunitiesAndAlerts />
      <TalkingPoints />
      <BottomSections />
    </div>
  );
}
