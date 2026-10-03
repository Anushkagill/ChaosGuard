import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { TARGET_SERVICES, FAULT_TYPES, FAULT_IMPACTS } from '../../utils/constants';
import { Zap, Clock, ShieldAlert, AlertTriangle, Play, Check } from 'lucide-react';

export default function CreateExperimentModal({
  isOpen = false,
  initialTarget = null,
  onClose,
  onSubmit,
}) {
  const [targetService, setTargetService] = useState('payment-service');
  const [faultType, setFaultType] = useState('latency');
  const [durationSec, setDurationSec] = useState(10);
  const [latencyMs, setLatencyMs] = useState(3000);
  const [startImmediately, setStartImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync initial target if provided
  useEffect(() => {
    if (initialTarget && TARGET_SERVICES.some((t) => t.id === initialTarget)) {
      setTargetService(initialTarget);
    }
  }, [initialTarget]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      targetService,
      faultType,
      duration: durationSec,
      faultConfig:
        faultType === 'latency'
          ? { delayMs: Number(latencyMs) }
          : faultType === 'error'
          ? { statusCode: 500, message: 'ChaosGuard simulated failure' }
          : {},
      startImmediately,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create experiment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const impact = FAULT_IMPACTS[targetService]?.[faultType] || 'Fault injection will alter downstream behavior.';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Chaos Experiment"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Target Service Selector */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
            Target Microservice
          </label>
          <div className="grid grid-cols-3 gap-3">
            {TARGET_SERVICES.map((t) => {
              const isSelected = targetService === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTargetService(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-glow-indigo text-slate-100 ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold font-mono">:{t.port}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="text-xs font-semibold truncate text-slate-100">{t.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.role}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fault Type Selector */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
            Fault Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {FAULT_TYPES.map((f) => {
              const isSelected = faultType === f.id;
              return (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setFaultType(f.id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                    isSelected
                      ? 'bg-amber-950/50 border-amber-500/80 shadow-glow-amber text-amber-200 ring-1 ring-amber-500/50'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">{f.label}</span>
                    {isSelected && <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">{f.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Parameter: Latency Slider */}
        {faultType === 'latency' && (
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Artificial Latency Delay:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{latencyMs} ms</span>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="500"
              value={latencyMs}
              onChange={(e) => setLatencyMs(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>500ms (Noticeable)</span>
              <span>3000ms (Default)</span>
              <span>10,000ms (Severe)</span>
            </div>
          </div>
        )}

        {/* Experiment Duration Slider */}
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Fault Duration:</span>
            <span className="font-mono font-bold text-indigo-400 text-sm">{durationSec} seconds</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-2"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>5s (Quick)</span>
            <span>10s (Standard)</span>
            <span>60s (Extended)</span>
          </div>
        </div>

        {/* Architectural Impact Notice */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-slate-200 block mb-0.5">Sequential Failure Impact</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">{impact}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Submission Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => {
                setStartImmediately(false);
                handleSubmit();
              }}
            >
              Save as Pending
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 shadow-glow-indigo"
              onClick={() => setStartImmediately(true)}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isSubmitting ? 'Starting...' : 'Inject & Start Now'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
