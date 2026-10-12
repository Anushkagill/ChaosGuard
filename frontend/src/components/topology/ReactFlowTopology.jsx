import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ChaosServiceNode from './ChaosServiceNode';
import ChaosEdge from './ChaosEdge';
import { computePropagation } from '../../utils/propagation';
import { Play, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';

// Default layout coordinates matching the diamond architecture
const INITIAL_NODE_POSITIONS = {
  'auth-service': { x: 312, y: 35 },
  'order-service': { x: 312, y: 205 },
  'payment-service': { x: 92, y: 385 },
  'inventory-service': { x: 532, y: 385 },
};

// Node and Edge types registered outside component to avoid remounting
const nodeTypes = {
  chaosService: ChaosServiceNode,
};

const edgeTypes = {
  chaosEdge: ChaosEdge,
};

/**
 * Helper to compute probe state for each service node
 */
function getNodeProbeState(serviceId, probeStatus) {
  if (!probeStatus?.isRunning && !probeStatus?.completed) return 'none';

  if (serviceId === 'order-service') {
    if (probeStatus.isRunning) return 'active';
    return probeStatus.success ? 'success' : 'error';
  }

  const stepMap = {
    'auth-service': 'auth',
    'inventory-service': 'inventory',
    'payment-service': 'payment',
  };
  const key = stepMap[serviceId];
  if (!key) return 'none';

  const step = probeStatus.steps?.[key];
  if (!step) {
    if (probeStatus.currentStep === key) return 'active';
    return probeStatus.completed ? 'skipped' : 'none';
  }
  return step.success ? 'success' : 'error';
}

/**
 * ReactFlowTopology renders an interactive React Flow graph for the 4-service cluster.
 * 
 * Satisfies Phase 8 requirements:
 * 1. Target identification
 * 2. Dependency relationships
 * 3. Affected services visualization
 * 4. Healthy / nominal service confirmation
 * 5. Failure propagation along the sequential pipeline
 */
export default function ReactFlowTopology({
  services = {},
  activeExperiment = null,
  probeStatus = null,
  onSelectService,
  onRunProbe,
}) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Fallback safe services
  const authService = services['auth-service'] || {
    id: 'auth-service',
    name: 'auth-service',
    displayName: 'Auth Service',
    port: 3003,
    role: 'Simulated Token Gateway',
    status: 'healthy',
  };

  const orderService = services['order-service'] || {
    id: 'order-service',
    name: 'order-service',
    displayName: 'Order Service',
    port: 3001,
    role: 'Sequential Orchestrator',
    status: 'healthy',
  };

  const inventoryService = services['inventory-service'] || {
    id: 'inventory-service',
    name: 'inventory-service',
    displayName: 'Inventory Service',
    port: 3004,
    role: 'Stock Reservation Target',
    status: 'healthy',
  };

  const paymentService = services['payment-service'] || {
    id: 'payment-service',
    name: 'payment-service',
    displayName: 'Payment Service',
    port: 3002,
    role: 'Payment Processing Target',
    status: 'healthy',
  };

  const servicesMap = useMemo(
    () => ({
      'auth-service': authService,
      'order-service': orderService,
      'inventory-service': inventoryService,
      'payment-service': paymentService,
    }),
    [authService, orderService, inventoryService, paymentService]
  );

  // Compute live propagation states
  const propagation = useMemo(
    () => computePropagation(servicesMap, activeExperiment, probeStatus),
    [servicesMap, activeExperiment, probeStatus]
  );

  // Initial node definitions
  const initialNodes = useMemo(() => {
    return Object.entries(INITIAL_NODE_POSITIONS).map(([id, pos]) => {
      const s = servicesMap[id];
      return {
        id,
        type: 'chaosService',
        position: pos,
        data: {
          service: s,
          isExperimentTarget: activeExperiment?.targetService === id,
          probeState: getNodeProbeState(id, probeStatus),
          propagationState: propagation.nodes[id] || 'nominal',
          onSelect: () => handleSelectService(s),
        },
      };
    });
  }, []);

  // Initial edge definitions
  const initialEdges = useMemo(() => {
    return [
      {
        id: 'order-to-auth',
        source: 'order-service',
        sourceHandle: 'top',
        target: 'auth-service',
        targetHandle: 'bottom',
        type: 'chaosEdge',
        data: {
          label: 'Step 1: Auth',
          stepNumber: 1,
          status: propagation.edges['order-to-auth'] || 'healthy',
          isHighlighted: false,
        },
      },
      {
        id: 'order-to-inventory',
        source: 'order-service',
        sourceHandle: 'bottom',
        target: 'inventory-service',
        targetHandle: 'top',
        type: 'chaosEdge',
        data: {
          label: 'Step 2: Reserve',
          stepNumber: 2,
          status: propagation.edges['order-to-inventory'] || 'healthy',
          isHighlighted: false,
        },
      },
      {
        id: 'order-to-payment',
        source: 'order-service',
        sourceHandle: 'bottom',
        target: 'payment-service',
        targetHandle: 'top',
        type: 'chaosEdge',
        data: {
          label: 'Step 3: Payment',
          stepNumber: 3,
          status: propagation.edges['order-to-payment'] || 'healthy',
          isHighlighted: false,
        },
      },
    ];
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleSelectService = useCallback(
    (service) => {
      setSelectedNodeId(service.id);
      if (onSelectService) {
        onSelectService(service);
      }
    },
    [onSelectService]
  );

  // Sync node data changes while preserving user drag positions
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const s = servicesMap[node.id] || {};
        return {
          ...node,
          selected: node.id === selectedNodeId,
          data: {
            service: s,
            isExperimentTarget: activeExperiment?.targetService === node.id,
            probeState: getNodeProbeState(node.id, probeStatus),
            propagationState: propagation.nodes[node.id] || 'nominal',
            onSelect: () => handleSelectService(s),
          },
        };
      })
    );
  }, [servicesMap, activeExperiment, probeStatus, propagation, selectedNodeId, handleSelectService, setNodes]);

  // Sync edge data changes
  useEffect(() => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const status = propagation.edges[edge.id] || 'healthy';
        const isConnectedToHover =
          hoveredNodeId === edge.source || hoveredNodeId === edge.target;

        return {
          ...edge,
          data: {
            ...edge.data,
            status,
            isHighlighted: isConnectedToHover,
          },
        };
      })
    );
  }, [propagation, hoveredNodeId, setEdges]);

  // Node hover handlers for edge highlighting
  const onNodeMouseEnter = useCallback((_, node) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const onNodeClick = useCallback(
    (_, node) => {
      const s = servicesMap[node.id];
      if (s) {
        handleSelectService(s);
      }
    },
    [servicesMap, handleSelectService]
  );

  // Reset node positions to default diamond layout
  const handleResetLayout = () => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        position: INITIAL_NODE_POSITIONS[node.id] || node.position,
      }))
    );
  };

  // MiniMap node color logic
  const minimapNodeColor = (node) => {
    const propState = propagation.nodes[node.id];
    if (propState === 'target') return '#f43f5e';
    if (propState === 'affected') return '#f59e0b';
    if (propState === 'shielded') return '#64748b';
    return '#10b981';
  };

  return (
    <div className="relative w-full rounded-2xl bg-slate-950/70 border border-slate-800/80 p-5 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Background tech grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="text-base font-semibold text-slate-100 tracking-tight">
              Cluster Service Topology
            </h3>
            <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
              4 Microservices
            </span>
            <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-700/40">
              React Flow Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential Dependency Flow: Order Orchestrator &rarr; Auth (#1) &rarr; Inventory (#2) &rarr; Payment (#3)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleResetLayout}
            title="Reset node positions to default diamond layout"
            className="flex items-center gap-1.5 text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Layout
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onRunProbe}
            disabled={probeStatus?.isRunning}
            className="flex items-center gap-1.5 shadow-glow-indigo text-xs"
          >
            <Play className={`w-3.5 h-3.5 ${probeStatus?.isRunning ? 'animate-spin' : ''}`} />
            {probeStatus?.isRunning ? 'Probing Order Flow...' : 'Test Order Flow'}
          </Button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-800/60 bg-slate-950/90 shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.4}
          maxZoom={1.8}
          zoomOnScroll={false}
          panOnScroll={false}
          preventScrolling={false}
          panOnDrag={true}
          nodesDraggable={true}
          proOptions={{ hideAttribution: true }}
          className="chaosguard-react-flow"
        >
          <Background color="#1e293b" gap={24} size={1} />
          <Controls
            showInteractive={false}
            className="!bg-slate-900 !border !border-slate-800 !rounded-lg !shadow-xl !overflow-hidden"
          />
          <MiniMap
            nodeColor={minimapNodeColor}
            nodeStrokeWidth={2}
            maskColor="rgba(11, 15, 23, 0.75)"
            className="!bg-slate-950/90 !border !border-slate-800 !rounded-lg !shadow-xl"
            zoomable
            pannable
          />
        </ReactFlow>
      </div>

      {/* Footer Legend Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Nominal
          </span>
          <span className="flex items-center gap-1.5 font-medium text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Degraded (Latency)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Failed / Target
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span> Shielded
          </span>
          <span className="flex items-center gap-1.5 font-medium text-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span> Active Probe
          </span>
        </div>
        <div className="text-slate-400 italic text-[10px] sm:text-[11px]">
          Drag nodes &bull; Drag canvas to pan &bull; Use +/− to zoom &bull; Click node to inspect details
        </div>
      </div>
    </div>
  );
}
