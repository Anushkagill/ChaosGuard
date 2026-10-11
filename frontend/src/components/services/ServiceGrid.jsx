import React from 'react';
import ServiceCard from './ServiceCard';
import { Server, Activity, ShieldAlert, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

export default function ServiceGrid({
  services = {},
  isLoading = false,
  onRefresh,
  onSelectService,
  onInjectFault,
}) {
  const serviceList = Object.values(services);
  const totalCount = serviceList.length;
  const faultCount = serviceList.filter((s) => s.fault?.active).length;
  const healthyCount = serviceList.filter((s) => s.status === 'healthy' && !s.fault?.active).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              TOTAL SERVICES
            </span>
            <span className="text-xl font-bold text-slate-100 font-mono">
              {totalCount} Active
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              HEALTHY / NOMINAL
            </span>
            <span className="text-xl font-bold text-emerald-400 font-mono">
              {healthyCount} / {totalCount}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              ACTIVE CHAOS FAULTS
            </span>
            <span className={`text-xl font-bold font-mono ${faultCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {faultCount} Injected
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Grid of 4 Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {serviceList.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onSelect={onSelectService}
            onInjectFault={onInjectFault}
          />
        ))}
      </div>
    </div>
  );
}
