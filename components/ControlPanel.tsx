import React from 'react';
import { SimulationParams } from '../types';

interface ControlPanelProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  isRunning: boolean;
  onRunToggle: () => void;
  onReset: (type: 'random' | 'pulse') => void;
  currentStep: number;
}

const Slider: React.FC<{label: string, value: number, min: number, max: number, step: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, name?: string}> = ({label, ...props}) => (
    <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center text-sm">
            <label className="font-medium text-gray-300">{label}</label>
            <span className="px-2 py-1 text-xs font-mono bg-gray-700 rounded">{props.name === 'stepsPerFrame' ? props.value : props.value.toFixed(3)}</span>
        </div>
        <input type="range" {...props} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500" />
    </div>
);

const ControlPanel: React.FC<ControlPanelProps> = ({ params, setParams, isRunning, onRunToggle, onReset, currentStep }) => {
  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isInt = name === 'stepsPerFrame';
    setParams(prev => ({ ...prev, [name]: isInt ? parseInt(value) : parseFloat(value) }));
  };

  return (
    <div className="w-full lg:w-96 bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col space-y-6">
      <h2 className="text-2xl font-bold text-center text-purple-400">HDF-Attn Controls</h2>
      
      <div className="flex items-center justify-between bg-gray-900 p-3 rounded-md">
        <span className="font-mono text-lg text-gray-400">Step:</span>
        <span className="font-mono text-2xl text-green-400">{currentStep}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={onRunToggle} className={`w-full py-3 px-4 text-lg font-semibold rounded-md transition-colors duration-200 ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
          {isRunning ? 'Stop' : 'Run'}
        </button>
        <button onClick={() => onReset('random')} className="w-full py-3 px-4 text-lg font-semibold bg-gray-600 hover:bg-gray-500 rounded-md transition-colors duration-200">
          Reset
        </button>
      </div>
      <button onClick={() => onReset('pulse')} className="w-full py-2 text-md font-semibold bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200">
        Initialize Pulse
      </button>

      <div className="space-y-4 pt-4 border-t border-gray-700">
        <Slider label="β (Bistability)" name="beta" value={params.beta} min={0} max={0.5} step={0.005} onChange={handleParamChange} />
        <Slider label="c (Wave Speed)" name="c" value={params.c} min={0} max={2.0} step={0.05} onChange={handleParamChange} />
        <Slider label="κ (Damping)" name="kappa" value={params.kappa} min={0} max={1.0} step={0.01} onChange={handleParamChange} />
        <Slider label="ε (Noise)" name="noise" value={params.noise} min={0} max={0.1} step={0.001} onChange={handleParamChange} />
        <Slider label="Initial Scale" name="initialScale" value={params.initialScale} min={0.1} max={3.0} step={0.1} onChange={handleParamChange} />
        <Slider label="dt (Time Step)" name="dt" value={params.dt} min={0.001} max={0.1} step={0.001} onChange={handleParamChange} />
        <Slider label="Steps per Frame" name="stepsPerFrame" value={params.stepsPerFrame} min={1} max={50} step={1} onChange={handleParamChange} />
      </div>
    </div>
  );
};

export default ControlPanel;