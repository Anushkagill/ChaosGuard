import React, { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

/**
 * ChaosEdge is the custom React Flow edge for ChaosGuard dependency connections.
 * 
 * Features:
 * - Status-based styling (healthy, degraded, failed, probing, inactive/shielded)
 * - Animated particle flow along bezier curve for active flows
 * - Dashed stroke patterns for degraded/failed links
 * - Background glow for enhanced visibility
 * - Interactive midpoint step pill rendered via EdgeLabelRenderer
 */
function ChaosEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data = {},
  selected = false,
}) {
  const {
    status = 'healthy',
    label = '',
    stepNumber = null,
    isHighlighted = false,
  } = data;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const statusConfig = {
    healthy: {
      stroke: '#10b981', // emerald-500
      glow: 'rgba(16, 185, 129, 0.4)',
      dash: 'none',
      badgeBg: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300',
    },
    degraded: {
      stroke: '#f59e0b', // amber-500
      glow: 'rgba(245, 158, 11, 0.45)',
      dash: '6,4',
      badgeBg: 'bg-amber-950/90 border-amber-500/50 text-amber-300',
    },
    failed: {
      stroke: '#f43f5e', // rose-500
      glow: 'rgba(244, 63, 94, 0.55)',
      dash: '5,5',
      badgeBg: 'bg-rose-950/90 border-rose-500/50 text-rose-300',
    },
    probing: {
      stroke: '#38bdf8', // sky-400
      glow: 'rgba(56, 189, 248, 0.65)',
      dash: '4,4',
      badgeBg: 'bg-sky-950/90 border-sky-400/60 text-sky-200',
    },
    inactive: {
      stroke: '#475569', // slate-600
      glow: 'transparent',
      dash: '3,3',
      badgeBg: 'bg-slate-900/90 border-slate-700/60 text-slate-400',
    },
  };

  const config = statusConfig[status] || statusConfig.healthy;
  const activeHighlight = isHighlighted || selected;

  return (
    <>
      {/* Background glow path for high visibility on dark theme */}
      {status !== 'inactive' && (
        <path
          d={edgePath}
          fill="none"
          stroke={config.stroke}
          strokeWidth={activeHighlight ? 7 : 4}
          strokeOpacity={activeHighlight ? 0.35 : 0.2}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      )}

      {/* Main Connection Curve */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={config.stroke}
        strokeWidth={activeHighlight ? 2.5 : 1.75}
        strokeDasharray={config.dash}
        strokeLinecap="round"
        className={`transition-all duration-300 ${
          status === 'probing' ? 'animate-pulse' : ''
        }`}
        style={style}
      />

      {/* Animated particle flow if healthy or probing */}
      {(status === 'healthy' || status === 'probing') && (
        <circle r={activeHighlight ? 3.5 : 2.5} fill={config.stroke}>
          <animateMotion
            path={edgePath}
            dur={status === 'probing' ? '1.2s' : '3s'}
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Midpoint Step Pill */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-tight border shadow-lg backdrop-blur-sm transition-all duration-200 ${
                config.badgeBg
              } ${activeHighlight ? 'scale-105 shadow-md' : 'opacity-90 hover:opacity-100'}`}
            >
              {stepNumber && <span className="font-bold mr-1">#{stepNumber}</span>}
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(ChaosEdge);
