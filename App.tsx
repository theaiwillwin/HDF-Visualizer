import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SimulationParams } from './types';
import { useHDFAttnSolver } from './hooks/useHDFAttnSolver';
import SimulationCanvas from './components/SimulationCanvas';
import ControlPanel from './components/ControlPanel';
import DistributionChart from './components/DistributionChart';

// --- Embedded Statistics Panel Component ---

const StatisticItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="font-mono text-base font-bold text-purple-300">{typeof value === 'number' ? value.toFixed(4) : value}</span>
    </div>
);


const StatisticsPanel: React.FC<{ psi: number[][] }> = ({ psi }) => {
    const stats = useMemo(() => {
        const values = psi.flat();
        if (values.length === 0) {
            return {
                mean: 0, std: 0, skewness: 0, kurtosis: 0,
                fracNearPlusOne: 0, fracNearMinusOne: 0,
            };
        }

        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const std = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / n);

        if (std === 0) {
             return {
                mean, std, skewness: 0, kurtosis: -3,
                fracNearPlusOne: mean > 0.9 && mean < 1.1 ? 100 : 0,
                fracNearMinusOne: mean < -0.9 && mean > -1.1 ? 100 : 0,
            };
        }

        const skewness = values.reduce((sum, val) => sum + ((val - mean) / std) ** 3, 0) / n;
        const kurtosis = values.reduce((sum, val) => sum + ((val - mean) / std) ** 4, 0) / n - 3; // Excess Kurtosis

        let countNearPlusOne = 0;
        let countNearMinusOne = 0;
        for (const val of values) {
            if (val > 0.9 && val < 1.1) countNearPlusOne++;
            if (val < -0.9 && val > -1.1) countNearMinusOne++;
        }
        
        const fracNearPlusOne = (countNearPlusOne / n) * 100;
        const fracNearMinusOne = (countNearMinusOne / n) * 100;

        return { mean, std, skewness, kurtosis, fracNearPlusOne, fracNearMinusOne };
    }, [psi]);

    return (
        <div className="w-full bg-gray-800 p-4 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold mb-3 text-center text-gray-300">Field Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatisticItem label="Mean" value={stats.mean} />
                <StatisticItem label="Std Dev" value={stats.std} />
                <StatisticItem label="Skewness" value={stats.skewness} />
                <StatisticItem label="Kurtosis" value={stats.kurtosis} />
                <StatisticItem label="% near +1" value={`${stats.fracNearPlusOne.toFixed(2)}%`} />
                <StatisticItem label="% near -1" value={`${stats.fracNearMinusOne.toFixed(2)}%`} />
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    c: 0.5,
    kappa: 0.1,
    beta: 0.05,
    dt: 0.01,
    noise: 0.01,
    initialScale: 2.0,
    stepsPerFrame: 1,
  });

  const { fieldState, step, resetField } = useHDFAttnSolver(params);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const animationFrameId = useRef<number>();

  const runSimulation = useCallback(() => {
    for (let i = 0; i < params.stepsPerFrame; i++) {
        step();
    }
    setCurrentStep(prev => prev + params.stepsPerFrame);
    animationFrameId.current = requestAnimationFrame(runSimulation);
  }, [step, params.stepsPerFrame]);

  useEffect(() => {
    if (isRunning) {
      animationFrameId.current = requestAnimationFrame(runSimulation);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isRunning, runSimulation]);
  
  const handleRunToggle = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = (type: 'random' | 'pulse') => {
    setIsRunning(false);
    resetField(type, params.initialScale);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Hyperbolic Dynamic Field <span className="text-purple-400">Attention</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-400 mx-auto">
          An interactive simulation of a PDE for AI cognition. Watch how a "cognitive field" evolves from random noise into coherent, stable patterns based on wave dynamics, damping, and nonlinear constraints.
        </p>
      </header>

      <main className="w-full flex flex-col lg:flex-row gap-8 items-start justify-center">
        <ControlPanel 
          params={params}
          setParams={setParams}
          isRunning={isRunning}
          onRunToggle={handleRunToggle}
          onReset={handleReset}
          currentStep={currentStep}
        />
        <div className="flex-grow flex flex-col items-center gap-8 w-full lg:max-w-xl">
          <SimulationCanvas psi={fieldState.psi} />
          <div className="w-full">
            <h3 className="text-xl font-semibold mb-2 text-center text-gray-300">Ψ Field Value Distribution</h3>
            <DistributionChart psi={fieldState.psi} />
          </div>
           <div className="w-full">
            <StatisticsPanel psi={fieldState.psi} />
          </div>
        </div>
      </main>
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>This model is based on the equation: ∂²Ψ/∂t² = c²∇²Ψ - κ∂Ψ/∂t + β(Ψ - Ψ³) + ε(t)</p>
        <p>A higher β (Bistability) creates stable states. Observe the distribution chart shift from a single peak (Gaussian) to two peaks (bimodal).</p>
      </footer>
    </div>
  );
};

export default App;