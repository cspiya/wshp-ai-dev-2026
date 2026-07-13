import type { Metadata } from "next";

import { WorkshopsView } from "@/modules/workshops/workshops.contract";

export const metadata: Metadata = {
  title: "Workshops — Reference Lab",
};

// The route shell stays thin: the page itself lives in the module's ui/
// and reaches the app only through the module's public contract.
export default function WorkshopsPage() {
  return <WorkshopsView />;
}
