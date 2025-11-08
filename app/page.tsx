'use client';

import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import { z } from 'zod';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

const metricsSchema = z.object({
  balance: z.number(),
  equity: z.number(),
  dailyReturnPct: z.number(),
  winRate: z.number(),
  maxDrawdownPct: z.number()
});

type Metrics = z.infer<typeof metricsSchema>;

const signalSchema = z.object({
  symbol: z.string(),
  action: z.enum(['BUY', 'SELL', 'HOLD']),
  confidence: z.number(),
  stopLoss: z.number(),
  takeProfit: z.number(),
  timestamp: z.string()
});

type Signal = z.infer<typeof signalSchema>;

const tradeSchema = z.object({
  ticket: z.string(),
  symbol: z.string(),
  action: z.enum(['BUY', 'SELL']),
  volume: z.number(),
  openPrice: z.number(),
  currentPrice: z.number(),
  profit: z.number(),
  openedAt: z.string()
});

type Trade = z.infer<typeof tradeSchema>;

const statusSchema = z.object({
  connected: z.boolean(),
  accountId: z.string().nullable(),
  broker: z.string().nullable(),
  lastSync: z.string().nullable()
});

type Status = z.infer<typeof statusSchema>;

const strategySchema = z.object({
  shortWindow: z.number(),
  longWindow: z.number(),
  riskReward: z.number(),
  maxConcurrentPositions: z.number(),
  riskPerTradePct: z.number()
});

type Strategy = z.infer<typeof strategySchema>;

const defaultStrategy: Strategy = {
  shortWindow: 12,
  longWindow: 48,
  riskReward: 2.2,
  maxConcurrentPositions: 4,
  riskPerTradePct: 0.8
};

export default function Home() {
  const [strategy, setStrategy] = useState<Strategy>(defaultStrategy);
  const [symbol, setSymbol] = useState<string>('EURUSD');
  const [autoTrading, setAutoTrading] = useState<boolean>(false);

  const { data: metrics } = useSWR<Metrics>('/api/metrics', fetcher, {
    refreshInterval: 10000
  });

  const { data: signal } = useSWR<Signal>(`/api/signal?symbol=${symbol}`, fetcher, {
    refreshInterval: autoTrading ? 8000 : 0
  });

  const { data: trades, mutate: refreshTrades } = useSWR<Trade[]>(
    '/api/trades',
    fetcher,
    { refreshInterval: 12000 }
  );

  const { data: status, mutate: refreshStatus } = useSWR<Status>('/api/status', fetcher, {
    refreshInterval: 15000
  });

  const onStrategyChange = useCallback(
    (partial: Partial<Strategy>) => {
      setStrategy((prev) => {
        const next = { ...prev, ...partial };
        void fetch('/api/strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next)
        });
        return next;
      });
    },
    []
  );

  const toggleAutoTrading = useCallback(async () => {
    const next = !autoTrading;
    setAutoTrading(next);
    await fetch('/api/autopilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next })
    });
    void refreshStatus();
  }, [autoTrading, refreshStatus]);

  const deploySignal = useCallback(async () => {
    if (!signal) {
      return;
    }
    await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: signal.symbol,
        action: signal.action,
        takeProfit: signal.takeProfit,
        stopLoss: signal.stopLoss,
        confidence: signal.confidence
      })
    });
    void refreshTrades();
  }, [signal, refreshTrades]);

  const statusLabel = useMemo(() => {
    if (!status) return 'Connecting…';
    return status.connected ? 'Broker linked' : 'Disconnected';
  }, [status]);

  return (
    <main className="grid gap-6 p-6 md:grid-cols-[360px_1fr] xl:grid-cols-[360px_2fr_1fr]">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-cyan-500/10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold uppercase tracking-[0.3em] text-slate-300">
              Autonomy Deck
            </h1>
            <p className="text-xs text-slate-500">AI-orchestrated forex execution mesh</p>
          </div>
          <div className={`h-3 w-3 rounded-full ${status?.connected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
        </header>
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">status</p>
            <p className="text-lg font-semibold text-slate-100">{statusLabel}</p>
            {status?.accountId && (
              <p className="text-xs text-slate-500">#{status.accountId} · {status.broker}</p>
            )}
          </div>
          <button
            className={`w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition hover:from-cyan-400 hover:to-blue-500 ${autoTrading ? 'opacity-100' : ''}`}
            onClick={toggleAutoTrading}
          >
            {autoTrading ? 'Pause Autopilot' : 'Engage Autopilot'}
          </button>
          <div className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Symbol</p>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
            >
              {['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'XAUUSD'].map((asset) => (
                <option key={asset} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
          </div>
          <article className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Strategy Curvature</p>
            <div className="mt-3 space-y-3">
              <Slider
                label="Short Memory"
                value={strategy.shortWindow}
                min={4}
                max={24}
                step={1}
                onChange={(value) => onStrategyChange({ shortWindow: value })}
              />
              <Slider
                label="Long Memory"
                value={strategy.longWindow}
                min={24}
                max={120}
                step={4}
                onChange={(value) => onStrategyChange({ longWindow: value })}
              />
              <Slider
                label="Risk / Reward"
                value={strategy.riskReward}
                min={1.2}
                max={3.5}
                step={0.1}
                onChange={(value) => onStrategyChange({ riskReward: value })}
              />
              <Slider
                label="Max Positions"
                value={strategy.maxConcurrentPositions}
                min={1}
                max={10}
                step={1}
                onChange={(value) => onStrategyChange({ maxConcurrentPositions: value })}
              />
              <Slider
                label="Risk per Trade %"
                value={strategy.riskPerTradePct}
                min={0.2}
                max={2}
                step={0.1}
                onChange={(value) => onStrategyChange({ riskPerTradePct: value })}
              />
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6 shadow-xl shadow-blue-500/10">
        <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Realtime Alpha Feed</h2>
            <p className="text-sm text-slate-500">Transformer ensemble predicts momentum inflection points.</p>
          </div>
          <button
            className="rounded-full border border-cyan-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300 transition hover:border-cyan-300 hover:text-cyan-100"
            onClick={deploySignal}
            disabled={!signal}
          >
            Execute Signal
          </button>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Balance"
            value={metrics ? `$${metrics.balance.toFixed(2)}` : '…'}
            highlight
          />
          <MetricCard
            title="Equity"
            value={metrics ? `$${metrics.equity.toFixed(2)}` : '…'}
          />
          <MetricCard
            title="Daily Return"
            value={metrics ? `${metrics.dailyReturnPct.toFixed(2)}%` : '…'}
          />
          <MetricCard
            title="Win Rate"
            value={metrics ? `${metrics.winRate.toFixed(1)}%` : '…'}
          />
          <MetricCard
            title="Max Drawdown"
            value={metrics ? `${metrics.maxDrawdownPct.toFixed(1)}%` : '…'}
          />
        </div>
        <article className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-950/50 p-6">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Signal</p>
              <h3 className="text-lg font-semibold text-slate-100">{signal?.symbol ?? symbol}</h3>
            </div>
            <span className="rounded-full border border-slate-700 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
              {signal?.timestamp ? new Date(signal.timestamp).toLocaleTimeString() : 'Waiting'}
            </span>
          </header>
          <div className="grid gap-4 md:grid-cols-4">
            <SignalTile label="Action" value={signal?.action ?? '…'} accent={signal?.action === 'BUY' ? 'text-emerald-400' : signal?.action === 'SELL' ? 'text-rose-400' : 'text-slate-400'} />
            <SignalTile label="Confidence" value={signal ? `${(signal.confidence * 100).toFixed(1)}%` : '…'} />
            <SignalTile label="Stop Loss" value={signal ? signal.stopLoss.toFixed(5) : '…'} />
            <SignalTile label="Take Profit" value={signal ? signal.takeProfit.toFixed(5) : '…'} />
          </div>
        </article>
        <article className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-950/50 p-6">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Positions</p>
              <h3 className="text-lg font-semibold text-slate-100">Live Orders</h3>
            </div>
            <button
              className="rounded-full border border-slate-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:border-cyan-400 hover:text-cyan-200"
              onClick={() => {
                void refreshTrades();
              }}
            >
              Refresh
            </button>
          </header>
          <div className="space-y-3">
            {trades && trades.length > 0 ? (
              trades.map((trade) => (
                <TradeRow key={trade.ticket} trade={trade} />
              ))
            ) : (
              <p className="text-sm text-slate-500">No open positions detected.</p>
            )}
          </div>
        </article>
      </section>

      <section className="hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-purple-500/10 xl:block">
        <h2 className="text-lg font-semibold text-slate-100">Telemetry</h2>
        <ul className="mt-4 space-y-4 text-sm text-slate-400">
          <li>
            Latency map between signal inference and broker execution is continuously streamed here for
            diagnostics. Webhooks degrade gracefully to socket fallbacks when MetaTrader5 bridge throttles.
          </li>
          <li>
            Adaptive risk governor monitors volatility compression and expands risk only when Sharpe ratio exceeds 2.2
            over rolling 24 hour windows.
          </li>
          <li>
            Engine synthesizes transformer, gradient boosting, and Kalman-smooth momentum for high-confidence entries.
          </li>
        </ul>
      </section>
    </main>
  );
}

function MetricCard({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <article
      className={`rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 ${
        highlight ? 'shadow-lg shadow-cyan-500/10' : ''
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-semibold text-slate-100">{value}</p>
    </article>
  );
}

function SignalTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="space-y-1 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`text-lg font-semibold ${accent ?? 'text-slate-200'}`}>{value}</p>
    </div>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  const directionClass = trade.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400';
  const profitClass = trade.profit >= 0 ? 'text-emerald-300' : 'text-rose-300';
  return (
    <article className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-200">
          {trade.symbol}{' '}
          <span className={directionClass}>{trade.action}</span>
        </p>
        <p className="text-xs text-slate-500">#{trade.ticket} · {new Date(trade.openedAt).toLocaleTimeString()}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-slate-400">@ {trade.openPrice.toFixed(5)}</p>
        <p className={`text-sm font-semibold ${profitClass}`}>{trade.profit.toFixed(2)}</p>
      </div>
    </article>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <span className="text-slate-300">{value}</span>
      </div>
      <input
        className="w-full cursor-pointer accent-cyan-500"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
