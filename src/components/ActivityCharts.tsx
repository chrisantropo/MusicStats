"use client";

import React from "react";
import { DashboardMetrics } from "@/types/spotify";
import { Clock, Calendar, TrendingUp, Flame } from "lucide-react";

interface ActivityChartsProps {
  metrics: DashboardMetrics;
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function ActivityCharts({ metrics }: ActivityChartsProps) {
  const maxHourVal = Math.max(...metrics.hourlyDistribution, 1);
  const maxDayVal = Math.max(...metrics.weekdayDistribution, 1);
  const maxMonthVal = Math.max(
    ...metrics.monthlyTimeline.map((m) => m.minutes),
    1
  );

  // Peak hour
  const peakHourIdx = metrics.hourlyDistribution.indexOf(maxHourVal);
  const peakDayIdx = metrics.weekdayDistribution.indexOf(maxDayVal);

  return (
    <div className="space-y-6">
      {/* Row 1: Hourly & Weekday Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 24-Hour Distribution */}
        <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Actividad por Hora del Día (00h – 23h)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tu hora pico es a las{" "}
                <strong className="text-emerald-400">
                  {String(peakHourIdx).padStart(2, "0")}:00h
                </strong>{" "}
                ({maxHourVal.toLocaleString()} min acumulados)
              </p>
            </div>
          </div>

          <div className="h-48 flex items-end gap-1.5 pt-4">
            {metrics.hourlyDistribution.map((mins, hour) => {
              const heightPct = Math.max((mins / maxHourVal) * 100, 3);
              const isPeak = hour === peakHourIdx && mins > 0;
              return (
                <div
                  key={hour}
                  className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end"
                >
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 bg-zinc-950 border border-zinc-700 text-white text-[10px] font-semibold px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                    {String(hour).padStart(2, "0")}:00 ·{" "}
                    {mins.toLocaleString()}m
                  </div>
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      isPeak
                        ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                        : "bg-emerald-500/40 group-hover:bg-emerald-400/80"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {hour % 3 === 0 ? `${hour}h` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day of Week Distribution */}
        <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-6">
          <div className="mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Minutos por Día de la Semana
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              El día que más escuchas música es el{" "}
              <strong className="text-emerald-400">
                {WEEKDAYS[peakDayIdx]}
              </strong>
            </p>
          </div>

          <div className="space-y-3">
            {WEEKDAYS.map((dayName, idx) => {
              const mins = metrics.weekdayDistribution[idx];
              const pct = Math.max((mins / maxDayVal) * 100, 2);
              const isPeak = idx === peakDayIdx && mins > 0;
              return (
                <div key={dayName} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        isPeak ? "text-emerald-400" : "text-zinc-300"
                      }`}
                    >
                      {dayName}
                    </span>
                    <span className="text-zinc-400">
                      {mins.toLocaleString()} min
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPeak ? "bg-emerald-400" : "bg-emerald-500/60"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Monthly Evolution Timeline */}
      <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Evolución Mensual de Escucha
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Historial de minutos reproducidos mes a mes ({metrics.firstDate} a{" "}
              {metrics.lastDate})
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Racha más larga:{" "}
              <strong className="text-white">
                {metrics.longestStreak.days} días seguidos
              </strong>
            </span>
          </div>
        </div>

        {metrics.monthlyTimeline.length === 0 ? (
          <p className="text-sm text-zinc-500 py-8 text-center">
            Sin datos suficientes para mostrar línea temporal.
          </p>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px] h-52 flex items-end gap-2 pt-8 px-1">
              {metrics.monthlyTimeline.map((item) => {
                const heightPct = Math.max(
                  (item.minutes / maxMonthVal) * 100,
                  4
                );
                return (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-zinc-950 border border-zinc-700 text-white text-[10px] font-semibold px-2.5 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                      {item.month}: {item.minutes.toLocaleString()} min (
                      {item.plays} temas)
                    </div>
                    <div
                      className="w-full max-w-[38px] bg-gradient-to-t from-emerald-600/50 to-emerald-400 rounded-t-md group-hover:from-emerald-500 group-hover:to-emerald-300 transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-zinc-500 font-mono rotate-0 truncate max-w-[48px]">
                      {item.month.slice(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

