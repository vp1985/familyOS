import { roomMetricsFromMillimeters } from "@/lib/renovation";

type FloorPlan = {
  shapeType: string;
  pointsJson: string | null;
  markers: Array<{ id: string; type: string; label: string; wall: string | null; xM: number | null; yM: number | null; widthM: number | null; note: string | null }>;
} | null;

type Room = {
  name: string;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  floorPlan: FloorPlan;
};

function meters(valueMm: number | null) {
  return valueMm ? valueMm / 1000 : null;
}

function formatM(value: number | null) {
  return value === null ? "—" : `${value.toLocaleString("de-DE", { maximumFractionDigits: 2 })} m`;
}

function markerColor(type: string) {
  if (type === "WINDOW") return "#2563eb";
  if (type === "DOOR") return "#f59e0b";
  if (type === "RADIATOR") return "#dc2626";
  if (type === "SOCKET") return "#b45309";
  return "#64748b";
}

export function FloorPlanSvg({ room }: { room: Room }) {
  const lengthM = meters(room.lengthMm) ?? 5;
  const widthM = meters(room.widthMm) ?? 3.5;
  const metrics = roomMetricsFromMillimeters(room);
  const scale = Math.min(420 / lengthM, 260 / widthM);
  const roomWidth = lengthM * scale;
  const roomHeight = widthM * scale;
  const x = (560 - roomWidth) / 2;
  const y = (320 - roomHeight) / 2;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
      <svg viewBox="0 0 560 320" role="img" aria-label={`Grundriss ${room.name}`} className="h-auto w-full">
        <defs>
          <pattern id="renovation-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="560" height="320" fill="url(#renovation-grid)" />
        <rect x={x} y={y} width={roomWidth} height={roomHeight} rx="3" fill="#ecfdf5" stroke="#0f172a" strokeWidth="8" />
        <text x={280} y={Math.max(24, y - 18)} textAnchor="middle" fontSize="15" fontWeight="800" fill="#334155">
          {formatM(meters(room.lengthMm))}
        </text>
        <text x={Math.max(30, x - 32)} y={160} textAnchor="middle" fontSize="15" fontWeight="800" fill="#334155" transform={`rotate(-90 ${Math.max(30, x - 32)} 160)`}>
          {formatM(meters(room.widthMm))}
        </text>
        {(room.floorPlan?.markers ?? []).slice(0, 8).map((marker, index) => {
          const markerX = marker.xM === null ? x + roomWidth / 2 : x + marker.xM * scale;
          const markerY = marker.yM === null ? y + 24 + index * 28 : y + marker.yM * scale;
          const color = markerColor(marker.type);
          return (
            <g key={marker.id}>
              <circle cx={markerX} cy={markerY} r="10" fill="white" stroke={color} strokeWidth="4" />
              <text x={markerX + 14} y={markerY + 5} fontSize="12" fontWeight="700" fill={color}>{marker.label}</text>
            </g>
          );
        })}
        {metrics ? (
          <g>
            <rect x="16" y="236" width="185" height="66" rx="16" fill="rgba(255,255,255,.9)" stroke="#e2e8f0" />
            <text x="30" y="260" fontSize="13" fontWeight="800" fill="#0f172a">{metrics.floorAreaM2.toLocaleString("de-DE")} m² Boden</text>
            <text x="30" y="280" fontSize="12" fill="#64748b">{metrics.perimeterM.toLocaleString("de-DE")} m Umfang · {metrics.paintLiters.toLocaleString("de-DE")} l Farbe</text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
