import { SiRailway } from "react-icons/si";

export function SCRLogo() {
  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-primary text-primary-foreground">
      <div className="flex items-center gap-2">
        <SiRailway className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">South Central Railway</h1>
          <p className="text-sm">Operating Branch Terminal Detention</p>
        </div>
      </div>
    </div>
  );
}
