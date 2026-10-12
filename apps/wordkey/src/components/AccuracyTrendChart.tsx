import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Award, Zap, Target } from 'lucide-react';
import { TaskProgressPoint } from '../types';

interface AccuracyTrendChartProps {
  data: TaskProgressPoint[];
  title?: string;
}

export const AccuracyTrendChart: React.FC<AccuracyTrendChartProps> = ({
  data,
  title = '本次任务准确率变化趋势',
}) => {
  const [viewMode, setViewMode] = useState<'accuracy' | 'wpm' | 'both'>('accuracy');

  // Compute stats and insights
  const insights = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        avgAccuracy: 100,
        peakAccuracy: 100,
        avgWpm: 0,
        peakWpm: 0,
        flawlessCount: 0,
        flawlessRate: 100,
        trendText: '数据记录中',
      };
    }

    const accuracies = data.map((d) => d.cumulativeAccuracy);
    const wpms = data.map((d) => d.wpm);
    const avgAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / data.length);
    const peakAccuracy = Math.max(...accuracies);
    const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / data.length);
    const peakWpm = Math.max(...wpms);

    const flawlessCount = data.filter((d) => d.mistakes === 0).length;
    const flawlessRate = Math.round((flawlessCount / data.length) * 100);

    // Trend assessment
    let trendText = '稳定发挥';
    if (data.length >= 4) {
      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b.cumulativeAccuracy, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b.cumulativeAccuracy, 0) / secondHalf.length;
      const diff = Math.round(secondAvg - firstAvg);

      if (diff > 1) {
        trendText = `进步显著（后半程提升 +${diff}%）`;
      } else if (diff < -2) {
        trendText = `平稳练习（保持高专注度）`;
      } else {
        trendText = `发挥稳健（持续保持高准确度）`;
      }
    }

    return {
      avgAccuracy,
      peakAccuracy,
      avgWpm,
      peakWpm,
      flawlessCount,
      flawlessRate,
      trendText,
    };
  }, [data]);

  // If no data yet
  if (!data || data.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
        正在记录打字准确率数据...
      </div>
    );
  }

  // Min and max for Y-Axis
  const minAcc = Math.max(0, Math.min(...data.map((d) => d.cumulativeAccuracy)) - 5);
  const maxAcc = 100;

  return (
    <div className="w-full rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 p-3.5 sm:p-4 my-3 text-left">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>{title}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {insights.trendText} · 零失误词汇率：{insights.flawlessRate}%
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => setViewMode('accuracy')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'accuracy'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            准确率 %
          </button>
          <button
            type="button"
            onClick={() => setViewMode('wpm')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'wpm'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            打字速度 (WPM)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'both'
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 font-semibold shadow-2xs'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            双指标趋势
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-44 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#94a3b8"
              opacity={0.15}
              vertical={false}
            />
            <XAxis
              dataKey="index"
              tickLine={false}
              axisLine={{ stroke: '#94a3b8', opacity: 0.2 }}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(val) => `第${val}词`}
            />
            <YAxis
              yAxisId="acc"
              domain={[minAcc, maxAcc]}
              tickLine={false}
              axisLine={{ stroke: '#94a3b8', opacity: 0.2 }}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(val) => `${val}%`}
              orientation="left"
              hide={viewMode === 'wpm'}
            />
            {viewMode !== 'accuracy' && (
              <YAxis
                yAxisId="wpm"
                orientation="right"
                domain={[0, 'auto']}
                tickLine={false}
                axisLine={{ stroke: '#94a3b8', opacity: 0.2 }}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val) => `${val}`}
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload as TaskProgressPoint;
                return (
                  <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-2.5 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between gap-3 mb-1">
                      <span>第 {point.index} 词: {point.word}</span>
                      {point.mistakes === 0 ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                          无失误
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-semibold">
                          {point.mistakes} 次失误
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5 text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">累计准确率:</span>
                        <span className="font-mono-code font-bold text-emerald-600 dark:text-emerald-400">
                          {point.cumulativeAccuracy}%
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">打字速度:</span>
                        <span className="font-mono-code font-bold text-indigo-600 dark:text-indigo-400">
                          {point.wpm} WPM
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            {/* Reference Line for average accuracy */}
            {viewMode !== 'wpm' && (
              <ReferenceLine
                yAxisId="acc"
                y={insights.avgAccuracy}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
            )}

            {/* Accuracy Area */}
            {(viewMode === 'accuracy' || viewMode === 'both') && (
              <Area
                yAxisId="acc"
                type="monotone"
                dataKey="cumulativeAccuracy"
                name="准确率"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#accuracyGradient)"
                dot={{ r: 2.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#fff' }}
                activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              />
            )}

            {/* WPM Area */}
            {(viewMode === 'wpm' || viewMode === 'both') && (
              <Area
                yAxisId={viewMode === 'both' ? 'wpm' : 'acc'}
                type="monotone"
                dataKey="wpm"
                name="速度"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#wpmGradient)"
                dot={{ r: 2, fill: '#6366f1', strokeWidth: 1.5, stroke: '#fff' }}
                activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mini metric badges */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <Target className="w-3.5 h-3.5 text-emerald-500" />
          <span>峰值准确率: <strong className="text-emerald-600 dark:text-emerald-400 font-mono-code">{insights.peakAccuracy}%</strong></span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <Zap className="w-3.5 h-3.5 text-indigo-500" />
          <span>极速 WPM: <strong className="text-indigo-600 dark:text-indigo-400 font-mono-code">{insights.peakWpm}</strong></span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>全对通过: <strong className="text-slate-700 dark:text-slate-200 font-mono-code">{insights.flawlessCount}/{data.length}</strong> 词</span>
        </div>
      </div>
    </div>
  );
};
