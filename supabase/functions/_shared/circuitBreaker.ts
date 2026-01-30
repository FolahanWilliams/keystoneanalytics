/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by failing fast when a service is unhealthy
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, skip requests
  HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

interface CircuitBreakerConfig {
  failureThreshold: number;   // Failures before opening
  successThreshold: number;   // Successes to close from half-open
  resetTimeoutMs: number;     // Time to wait before half-open
  name: string;               // Circuit name for logging
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: number;
  lastStateChange: number;
}

// Default configuration
export const DEFAULT_CIRCUIT_CONFIG: Omit<CircuitBreakerConfig, 'name'> = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeoutMs: 60 * 1000, // 1 minute
};

// In-memory circuit states
const circuits = new Map<string, CircuitBreakerState>();

/**
 * Get or create circuit breaker state
 */
function getCircuitState(name: string): CircuitBreakerState {
  let state = circuits.get(name);
  
  if (!state) {
    state = {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      lastFailure: 0,
      lastStateChange: Date.now(),
    };
    circuits.set(name, state);
  }
  
  return state;
}

/**
 * Transition circuit to a new state
 */
function transitionTo(circuit: CircuitBreakerState, newState: CircuitState, name: string): void {
  if (circuit.state !== newState) {
    console.log(`[CircuitBreaker:${name}] State transition: ${circuit.state} -> ${newState}`);
    circuit.state = newState;
    circuit.lastStateChange = Date.now();
    
    if (newState === CircuitState.CLOSED) {
      circuit.failures = 0;
      circuit.successes = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      circuit.successes = 0;
    }
  }
}

/**
 * Check if the circuit allows the request
 */
export function canExecute(config: CircuitBreakerConfig): boolean {
  const circuit = getCircuitState(config.name);
  const now = Date.now();
  
  switch (circuit.state) {
    case CircuitState.CLOSED:
      return true;
      
    case CircuitState.OPEN:
      // Check if we should transition to half-open
      if (now - circuit.lastStateChange >= config.resetTimeoutMs) {
        transitionTo(circuit, CircuitState.HALF_OPEN, config.name);
        return true;
      }
      return false;
      
    case CircuitState.HALF_OPEN:
      // Allow limited requests to test recovery
      return true;
      
    default:
      return true;
  }
}

/**
 * Record a successful request
 */
export function recordSuccess(config: CircuitBreakerConfig): void {
  const circuit = getCircuitState(config.name);
  
  switch (circuit.state) {
    case CircuitState.CLOSED:
      // Reset failure count on success
      circuit.failures = 0;
      break;
      
    case CircuitState.HALF_OPEN:
      circuit.successes++;
      if (circuit.successes >= config.successThreshold) {
        transitionTo(circuit, CircuitState.CLOSED, config.name);
      }
      break;
      
    case CircuitState.OPEN:
      // Shouldn't happen, but handle gracefully
      break;
  }
}

/**
 * Record a failed request
 */
export function recordFailure(config: CircuitBreakerConfig): void {
  const circuit = getCircuitState(config.name);
  circuit.failures++;
  circuit.lastFailure = Date.now();
  
  switch (circuit.state) {
    case CircuitState.CLOSED:
      if (circuit.failures >= config.failureThreshold) {
        transitionTo(circuit, CircuitState.OPEN, config.name);
      }
      break;
      
    case CircuitState.HALF_OPEN:
      // Single failure in half-open goes back to open
      transitionTo(circuit, CircuitState.OPEN, config.name);
      break;
      
    case CircuitState.OPEN:
      // Already open, just update failure time
      break;
  }
}

/**
 * Get current circuit state info (for monitoring)
 */
export function getCircuitInfo(name: string): {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: number;
  lastStateChange: number;
} {
  return { ...getCircuitState(name) };
}

/**
 * Reset a circuit breaker (for testing/admin purposes)
 */
export function resetCircuit(name: string): void {
  circuits.delete(name);
  console.log(`[CircuitBreaker:${name}] Reset to initial state`);
}

/**
 * Execute a function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  config: CircuitBreakerConfig,
  fn: () => Promise<T>,
  fallback?: () => T | Promise<T>
): Promise<T> {
  if (!canExecute(config)) {
    console.warn(`[CircuitBreaker:${config.name}] Circuit is OPEN, skipping execution`);
    
    if (fallback) {
      return await fallback();
    }
    
    throw new Error(`Circuit breaker ${config.name} is open`);
  }
  
  try {
    const result = await fn();
    recordSuccess(config);
    return result;
  } catch (error) {
    recordFailure(config);
    
    if (fallback && getCircuitInfo(config.name).state === CircuitState.OPEN) {
      console.log(`[CircuitBreaker:${config.name}] Executing fallback`);
      return await fallback();
    }
    
    throw error;
  }
}
