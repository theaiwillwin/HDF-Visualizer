export interface SimulationParams {
  c: number;
  kappa: number;
  beta: number;
  dt: number;
  noise: number;
  initialScale: number;
  stepsPerFrame: number;
}

export interface FieldState {
  psi: number[][];
  psi_t: number[][];
}

export interface ChartData {
  name: string;
  count: number;
}