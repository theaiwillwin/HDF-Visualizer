
import { useState, useCallback, useRef } from 'react';
import { SimulationParams, FieldState } from '../types';

const GRID_SIZE = 128;

// Initial field creators
const createRandomField = (scale: number): number[][] => {
  return Array(GRID_SIZE).fill(0).map(() => 
    Array(GRID_SIZE).fill(0).map(() => (Math.random() - 0.5) * 2 * scale)
  );
};

const createPulseField = (scale: number): number[][] => {
    const field = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    const center = GRID_SIZE / 2;
    const radius = 10;
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const dist = Math.sqrt((i - center) ** 2 + (j - center) ** 2);
            if (dist < radius) {
                field[i][j] = scale * (1 - dist / radius);
            }
        }
    }
    return field;
};

const createZeroField = (): number[][] => {
  return Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
};

export const useHDFAttnSolver = (params: SimulationParams) => {
  const [fieldState, setFieldState] = useState<FieldState>({
    psi: createRandomField(params.initialScale),
    psi_t: createZeroField(),
  });
  const fieldStateRef = useRef(fieldState);
  fieldStateRef.current = fieldState;

  const resetField = useCallback((type: 'random' | 'pulse', scale: number) => {
    let newPsi;
    if (type === 'random') {
        newPsi = createRandomField(scale);
    } else {
        newPsi = createPulseField(scale);
    }
    setFieldState({
      psi: newPsi,
      psi_t: createZeroField(),
    });
  }, []);

  const step = useCallback(() => {
    const { psi, psi_t } = fieldStateRef.current;
    const { c, kappa, beta, dt, noise } = params;

    const newPsi = createZeroField();
    const newPsi_t = createZeroField();

    // --- 1. Calculate Spatial Second Derivative (Laplacian) ---
    const laplacian = createZeroField();
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const psi_center = psi[i][j];
            // Use Neumann boundary conditions (zero-gradient)
            const psi_left = (j > 0) ? psi[i][j - 1] : psi_center;
            const psi_right = (j < GRID_SIZE - 1) ? psi[i][j + 1] : psi_center;
            const psi_up = (i > 0) ? psi[i - 1][j] : psi_center;
            const psi_down = (i < GRID_SIZE - 1) ? psi[i + 1][j] : psi_center;
            
            laplacian[i][j] = (psi_left + psi_right + psi_up + psi_down - 4 * psi_center);
        }
    }
    
    // Using Verlet Integration
    const F = createZeroField();
    const noiseField = createZeroField();

    for(let i = 0; i < GRID_SIZE; i++) {
        for(let j = 0; j < GRID_SIZE; j++) {
            const F_bistable = beta * (psi[i][j] - Math.pow(psi[i][j], 3));
            F[i][j] = (c * c * laplacian[i][j]) + F_bistable;
            noiseField[i][j] = (Math.random() - 0.5) * 2 * noise;
        }
    }

    const psi_t_half = createZeroField();
    for(let i = 0; i < GRID_SIZE; i++) {
        for(let j = 0; j < GRID_SIZE; j++) {
            psi_t_half[i][j] = psi_t[i][j] + 0.5 * dt * (F[i][j] - kappa * psi_t[i][j] + noiseField[i][j]);
        }
    }

    for(let i = 0; i < GRID_SIZE; i++) {
        for(let j = 0; j < GRID_SIZE; j++) {
            newPsi[i][j] = psi[i][j] + dt * psi_t_half[i][j];
        }
    }
    
    // Recompute forces at new position (for Verlet accuracy)
    const new_laplacian = createZeroField();
     for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const psi_center = newPsi[i][j];
            const psi_left = (j > 0) ? newPsi[i][j - 1] : psi_center;
            const psi_right = (j < GRID_SIZE - 1) ? newPsi[i][j + 1] : psi_center;
            const psi_up = (i > 0) ? newPsi[i - 1][j] : psi_center;
            const psi_down = (i < GRID_SIZE - 1) ? newPsi[i + 1][j] : psi_center;
            new_laplacian[i][j] = (psi_left + psi_right + psi_up + psi_down - 4 * psi_center);
        }
    }

    const new_F = createZeroField();
     for(let i = 0; i < GRID_SIZE; i++) {
        for(let j = 0; j < GRID_SIZE; j++) {
            const F_bistable = beta * (newPsi[i][j] - Math.pow(newPsi[i][j], 3));
            new_F[i][j] = (c * c * new_laplacian[i][j]) + F_bistable;
        }
    }

    for(let i = 0; i < GRID_SIZE; i++) {
        for(let j = 0; j < GRID_SIZE; j++) {
            newPsi_t[i][j] = psi_t_half[i][j] + 0.5 * dt * (new_F[i][j] - kappa * psi_t_half[i][j] + noiseField[i][j]);
        }
    }

    setFieldState({ psi: newPsi, psi_t: newPsi_t });
  }, [params]);

  return { fieldState, step, resetField };
};
