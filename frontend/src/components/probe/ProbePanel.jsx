import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Play, CheckCircle2, XCircle, Clock, ArrowRight, ShieldAlert, AlertTriangle, RefreshCw, Terminal } from 'lucide-react';
import { runOrderProbe } from '../../api/probe';

export default function ProbePanel({
  probeStatus,
  onRunProbe,
  onLogEvent,
}) {
  const [token, setToken] = useState('valid-token');
  const [customAmount, setCustomAmount] = useState(150);
  const [result, setResult] = useState(null);
  const [isProbing, setIsProbing] = useState(false);

  const handleExecuteProbe = async () => {
    setIsProbing(true);
    setResult(null);

    if (onLogEvent) {
      onLogEvent('INFO', `Triggering live Order Flow Probe (token: "${token}", amount: $${customAmount})`);
    }

    try {
      const probeResult = await runOrderProbe({ token, amount: customAmount });
      setResult(probeResult);

      if (onLogEvent) {
        if (probeResult.success) {
          onLogEvent('SUCCESS', `Order Probe completed successfully in ${probeResult.duration}ms (Order #${probeResult.orderId})`);
        } else {
          onLogEvent('ERROR', `Order Probe failed (${probeResult.status || 502}): ${probeResult.error || 'Gateway Error'} (Broken at ${probeResult.failedStep})`);
        }
      }

      if (onRunProbe) {
        onRunProbe(probeResult);
      }
    } catch (err) {
      const errResult = {
        success: false,
        duration: 0,
        status: 502,
        error: err.message || 'Probe execution failed',
        failedStep: 'unknown',
        steps: {
          auth: { success: false, error: err.message },
          inventory: { skipped: true },
          payment: { skipped: true },
        },
      };
      setResult(errResult);
      if (onLogEvent) {
        onLogEvent('ERROR', `Order Probe communication error: ${err.message}`);
      }
    } finally {
      setIsProbing(false);
    }
  };

  const steps = [
    {
      id: 'auth',
      name: 'Auth Service',
      port: 3003,
      stepNum: 1,
      action: 'Verify Token (/auth/verify)',
    },
    {
      id: 'inventory',
      name: 'Inventory Service',
      port: 3004,
      stepNum: 2,
      action: 'Reserve Stock (/inventory/reserve)',
    },
    {
      id: 'payment',
      name: 'Payment Service',
      port: 3002,
      stepNum: 3,
      action: 'Process Charge (/payments/charge)',
    },
  ];

  return (
    <Card className="p-5 border-slate-800 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-950 text-sky-400 border border-sky-800/60">
              <Terminal className="w-4 h-4" />
            </span>
            <h3 className="text-base font-semibold text-slate-100">
              Interactive Order Flow Probe
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Executes a real transaction through Order Service (:3001) to trace sequential failure cascades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Auth Token:</span>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs w-32 focus:outline-none focus:border-indigo-500"
              placeholder="valid-token"
            />
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={handleExecuteProbe}
            disabled={isProbing}
            className="flex items-center gap-1.5 shadow-glow-indigo text-xs"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isProbing ? 'animate-spin' : ''}`} />
            {isProbing ? 'Executing Flow...' : 'Send Order Request'}
          </Button>
        </div>
      </div>

      {/* Sequential Pipeline Visualizer */}
      <div>
        <div className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center justify-between">
          <span>Sequential Dependency Pipeline</span>
          {result && (
            <span className={`font-bold ${result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
              Total Response Time: {result.duration}ms
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((st) => {
            const stepResult = result?.steps?.[st.id];
            const isPassed = stepResult?.success;
            const isFailed = stepResult && !stepResult.success && !stepResult.skipped;
            const isSkipped = stepResult?.skipped;

            return (
              <div
                key={st.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isPassed
                    ? 'bg-emerald-950/30 border-emerald-600/50 shadow-glow-emerald'
                    : isFailed
                    ? 'bg-rose-950/40 border-rose-600/60 shadow-glow-rose'
                    : isSkipped
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    STEP #{st.stepNum}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    :{st.port}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-200 mb-1">
                  {st.name}
                </div>

                <div className="text-[11px] text-slate-400 leading-tight mb-2">
                  {st.action}
                </div>

                {/* Step Result State */}
                <div className="pt-2 border-t border-slate-800/60 text-xs font-mono">
                  {isPassed && (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PASSED (200 OK)
                    </span>
                  )}
                  {isFailed && (
                    <span className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                      <XCircle className="w-3.5 h-3.5" />
                      FAILED (Cascade Break)
                    </span>
                  )}
                  {isSkipped && (
                    <span className="text-slate-400 text-[11px] italic">
                      Skipped (Cascade Aborted)
                    </span>
                  )}
                  {!result && (
                    <span className="text-slate-400 text-[11px]">
                      Awaiting execution...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failure Propagation Analysis Banner */}
      {result && (
        <div className={`p-4 rounded-xl border ${
          result.success
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
            : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-sm block">
                {result.success
                  ? `Transaction Successful — Order #${result.orderId || 'ORD-OK'}`
                  : `Propagation Failure: ${result.error || '502 Bad Gateway'}`}
              </span>
              <p className="opacity-90 leading-relaxed text-[11px]">
                {result.success
                  ? 'All sequential microservice boundaries responded normally within SLA limits.'
                  : result.failedStep === 'auth'
                  ? 'Sequential Break at Step 1 (Auth Service). Because Auth failed, Order Service immediately halted. Inventory Service and Payment Service were shielded from redundant execution.'
                  : result.failedStep === 'inventory'
                  ? 'Sequential Break at Step 2 (Inventory Service). Auth Service passed token validation, but inventory reservation failed. Payment processing was avoided.'
                  : result.failedStep === 'payment'
                  ? 'Sequential Break at Step 3 (Payment Service). Auth and Inventory succeeded, but Payment failed. Order Service returned a 502 Bad Gateway error.'
                  : 'Order Service encountered an unhandled network or gateway failure.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Raw Response Payload Inspector */}
      {result?.raw && (
        <div>
          <div className="text-[11px] font-mono uppercase text-slate-400 mb-1.5">
            Raw Gateway JSON Response:
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
            {JSON.stringify(result.raw, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}
