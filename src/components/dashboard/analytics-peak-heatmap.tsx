"use client";

interface PeakData {
  heatmap: number[][];
  busiestDay: number;
  busiestHour: number;
  totalAppointments: number;
}

const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

export function AnalyticsPeakHeatmap({ data }: { data: PeakData }) {
  if (!data.heatmap || data.heatmap.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No hay datos suficientes</p>;
  }

  // Find max for normalization
  let max = 0;
  for (const row of data.heatmap) {
    for (const val of row) {
      if (val > max) max = val;
    }
  }

  function getColor(value: number): string {
    if (max === 0 || value === 0) return "rgba(255,255,255,0.02)";
    const intensity = value / max;
    if (intensity < 0.25) return "rgba(99, 102, 241, 0.15)";
    if (intensity < 0.5) return "rgba(99, 102, 241, 0.35)";
    if (intensity < 0.75) return "rgba(99, 102, 241, 0.6)";
    return "rgba(99, 102, 241, 0.9)";
  }

  // Only show business hours (7-22)
  const startHour = 7;
  const endHour = 22;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">Peak Hours</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Día más ocupado: <span className="font-semibold text-foreground">{dayLabels[data.busiestDay]}</span> a las{" "}
        <span className="font-semibold text-foreground">{hourLabels[data.busiestHour]}</span>
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex ml-10 mb-1">
            {hourLabels.slice(startHour, endHour).map((h, i) => (
              <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground">
                {i % 2 === 0 ? h.split(":")[0] : ""}
              </div>
            ))}
          </div>

          {/* Grid */}
          {data.heatmap.map((row, dayIndex) => (
            <div key={dayIndex} className="flex items-center gap-1 mb-1">
              <span className="w-9 text-right text-xs text-muted-foreground pr-1">
                {dayLabels[dayIndex]}
              </span>
              <div className="flex flex-1 gap-[2px]">
                {row.slice(startHour, endHour).map((val, hourIndex) => (
                  <div
                    key={hourIndex}
                    className="flex-1 h-6 rounded-sm transition-colors cursor-default"
                    style={{ backgroundColor: getColor(val) }}
                    title={`${dayLabels[dayIndex]} ${hourLabels[startHour + hourIndex]}: ${val} turnos`}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
            <span>Menos</span>
            {[0.02, 0.15, 0.35, 0.6, 0.9].map((opacity, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: i === 0
                    ? "rgba(255,255,255,0.02)"
                    : `rgba(99, 102, 241, ${opacity})`,
                }}
              />
            ))}
            <span>Más</span>
          </div>
        </div>
      </div>
    </div>
  );
}
