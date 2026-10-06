import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import ActiveExperimentBanner from './components/experiments/ActiveExperimentBanner';
import ReactFlowTopology from './components/topology/ReactFlowTopology';
import ServiceGrid from './components/services/ServiceGrid';
import ServiceDetailDrawer from './components/services/ServiceDetailDrawer';
import CreateExperimentModal from './components/experiments/CreateExperimentModal';
import ExperimentList from './components/experiments/ExperimentList';
import ExperimentDetailModal from './components/experiments/ExperimentDetailModal';
import ProbePanel from './components/probe/ProbePanel';
import EventConsole from './components/logs/EventConsole';

import useServices from './hooks/useServices';
import useExperiments from './hooks/useExperiments';
import useActiveExperiment from './hooks/useActiveExperiment';
import useEventLogs from './hooks/useEventLogs';

export default function App() {
  const [currentTab, setCurrentTab] = useState('topology');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [initialTargetForModal, setInitialTargetForModal] = useState(null);
  const [probeStatus, setProbeStatus] = useState(null);

  // Core domain hooks
  const { logs, addLog, clearLogs } = useEventLogs();
  const {
    services,
    isLoading: isServicesLoading,
    refresh: refreshServices,
    totalCount,
    healthyCount,
    faultCount,
  } = useServices({
    onStatusChange: (event) => {
      addLog(
        event.type === 'fault_injected' ? 'ACTIVE' : event.type === 'fault_cleared' ? 'CLEANUP' : 'INFO',
        event.message
      );
    },
  });

  const {
    experiments,
    isLoading: isExpLoading,
    fetchExperiments,
    createExperiment,
    startExperiment,
    stopExperiment,
  } = useExperiments({
    onEvent: (level, msg) => addLog(level, msg),
  });

  // Track active running experiment with countdown
  const {
    activeExperiment,
    countdown,
    progress,
    stopActiveExperiment,
  } = useActiveExperiment({
    onCompleted: (exp) => {
      addLog('CLEANUP', `Experiment ${exp.id} completed. Safety audit confirmed faultCleared: true.`);
      refreshServices();
      fetchExperiments();
    },
    onFailed: (exp) => {
      addLog('ERROR', `Experiment ${exp.id} failed: ${exp.failedReason || exp.error || 'Execution error'}`);
      refreshServices();
      fetchExperiments();
    },
  });

  // Log initial system boot
  useEffect(() => {
    addLog('INFO', 'ChaosGuard Observability Dashboard initialized (Phase 7).');
  }, []);

  // Handlers
  const handleOpenCreateModal = (targetServiceId = null) => {
    setInitialTargetForModal(targetServiceId);
    setIsCreateModalOpen(true);
  };

  const handleCreateExperiment = async (payload) => {
    const newExp = await createExperiment(payload);
    addLog('INFO', `Created experiment ${newExp.id} targeting ${payload.targetService} (${payload.faultType})`);

    if (payload.startImmediately) {
      await startExperiment(newExp.id);
      addLog('QUEUED', `Experiment ${newExp.id} sent to BullMQ queue.`);
    }

    refreshServices();
    fetchExperiments();
  };

  const handleStartExperiment = async (id) => {
    await startExperiment(id);
    addLog('QUEUED', `Experiment ${id} submitted to BullMQ worker queue.`);
    refreshServices();
    fetchExperiments();
  };

  const handleStopExperiment = async (id) => {
    await stopExperiment(id);
    addLog('CLEANUP', `Emergency stop invoked for ${id}. Fault cleared from target.`);
    refreshServices();
    fetchExperiments();
  };

  const handleProbeResult = (result) => {
    setProbeStatus(result);
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Application Header */}
      <Header
        healthyCount={healthyCount}
        totalCount={totalCount}
        faultCount={faultCount}
        activeExperiment={activeExperiment}
        onNewExperiment={() => handleOpenCreateModal()}
        onRunProbe={() => {
          setCurrentTab('topology');
          // Smooth scroll to probe panel if on topology
          const el = document.getElementById('probe-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Live Experiment Tracker Banner */}
      <ActiveExperimentBanner
        activeExperiment={activeExperiment}
        countdown={countdown}
        progress={progress}
        onStop={stopActiveExperiment}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <Navigation
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          counts={{
            services: totalCount,
            experiments: experiments.length,
            events: logs.length,
          }}
        />

        {/* Tab 1: Topology & Overview */}
        {currentTab === 'topology' && (
          <div className="space-y-6">
            {/* Centerpiece Topology Canvas */}
            <ReactFlowTopology
              services={services}
              activeExperiment={activeExperiment}
              probeStatus={probeStatus}
              onSelectService={(s) => setSelectedService(s)}
              onRunProbe={() => {
                const el = document.getElementById('probe-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Split Row: Live Order Probe + Mini Event Console */}
            <div id="probe-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <ProbePanel
                  probeStatus={probeStatus}
                  onRunProbe={handleProbeResult}
                  onLogEvent={addLog}
                />
              </div>
              <div className="lg:col-span-5">
                <EventConsole
                  logs={logs}
                  onClearLogs={clearLogs}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Services Catalog */}
        {currentTab === 'services' && (
          <ServiceGrid
            services={services}
            isLoading={isServicesLoading}
            onRefresh={refreshServices}
            onSelectService={(s) => setSelectedService(s)}
            onInjectFault={(s) => handleOpenCreateModal(s.id)}
          />
        )}

        {/* Tab 3: Experiments History */}
        {currentTab === 'experiments' && (
          <ExperimentList
            experiments={experiments}
            isLoading={isExpLoading}
            onRefresh={fetchExperiments}
            onStartExperiment={handleStartExperiment}
            onStopExperiment={handleStopExperiment}
            onSelectExperiment={(exp) => setSelectedExperiment(exp)}
            onCreateExperiment={() => handleOpenCreateModal()}
          />
        )}

        {/* Tab 4: System Events */}
        {currentTab === 'events' && (
          <EventConsole
            logs={logs}
            onClearLogs={clearLogs}
          />
        )}
      </main>

      {/* Slide-Over Service Inspector Drawer */}
      <ServiceDetailDrawer
        service={selectedService}
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
        onInjectFault={(s) => handleOpenCreateModal(s.id)}
        onFaultCleared={(serviceId) => {
          refreshServices();
          addLog('CLEANUP', `Fault manually cleared for ${serviceId}`);
        }}
      />

      {/* Create Experiment Modal */}
      <CreateExperimentModal
        isOpen={isCreateModalOpen}
        initialTarget={initialTargetForModal}
        onClose={() => {
          setIsCreateModalOpen(false);
          setInitialTargetForModal(null);
        }}
        onSubmit={handleCreateExperiment}
      />

      {/* Experiment Detail & Safety Audit Modal */}
      <ExperimentDetailModal
        experiment={selectedExperiment}
        isOpen={Boolean(selectedExperiment)}
        onClose={() => setSelectedExperiment(null)}
        onStop={(id) => handleStopExperiment(id)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 mt-8 bg-slate-950/80 text-center text-xs text-slate-400 font-mono">
        <span>ChaosGuard Resilience Platform &bull; Phase 8 Topology Dashboard &bull; 7-Container Cluster</span>
      </footer>
    </div>
  );
}
