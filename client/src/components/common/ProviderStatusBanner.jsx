import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { CloudOff, CheckCircle2, Server, AlertTriangle, RefreshCw } from 'lucide-react';

const ProviderStatusBanner = ({ fallbackUsed, fallbackNotice, onReload }) => {
  const [simulationState, setSimulationState] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/providers/status');
      setSimulationState(res.data.simulateFailure);
    } catch (e) {
      // Ignored in offline mode
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const toggleSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.post('/providers/simulate-failure', {
        enabled: !simulationState
      });
      setSimulationState(res.data.simulateFailure);
      if (onReload) onReload();
    } catch (e) {
      console.error('Failed to toggle provider simulation:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Active Fallback Alert (when fallback was triggered) */}
      {fallbackUsed && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900 shadow-sm animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-950">Provider Fallback Active</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              {fallbackNotice ||
                'Third-party external provider failed or timed out. Graceful fallback engaged: verified local database catalog is displayed.'}
            </p>
          </div>
        </div>
      )}

      {/* Interactive Simulation Control Widget */}
      <div className="p-3 bg-slate-100/90 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Server className="w-4 h-4 text-sky-600" />
          <span className="font-semibold text-slate-800">Travel Provider Adapter:</span>
          <span className="text-slate-600 font-mono text-[11px]">
            {fallbackUsed ? 'Fallback (Local DB)' : 'LocalProvider + MockExternal'}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[11px] text-slate-500 font-medium">Simulate 3rd-Party Failure:</span>
          <button
            onClick={toggleSimulation}
            disabled={loading}
            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1.5 shadow-sm ${
              simulationState
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : simulationState ? (
              <>
                <CloudOff className="w-3.5 h-3.5" /> Failure: ON
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Failure: OFF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderStatusBanner;
