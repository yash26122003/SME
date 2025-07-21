export interface CircuitBreakerOptions {
  timeout: number;
  errorThreshold: number;
  resetTimeout: number;
}

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private errorCount: number = 0;
  private nextAttempt: number = 0;
  private options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitBreakerState.HALF_OPEN;
    }

    try {
      const result = await Promise.race([
        action(),
        this.timeout()
      ]);

      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordError();
      throw error;
    }
  }

  private timeout<T>(): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Operation timed out'));
      }, this.options.timeout);
    });
  }

  private recordError(): void {
    this.errorCount++;
    if (this.errorCount >= this.options.errorThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }

  private reset(): void {
    this.errorCount = 0;
    this.state = CircuitBreakerState.CLOSED;
    this.nextAttempt = 0;
  }

  public getState(): { state: CircuitBreakerState; errorCount: number; nextAttempt: number } {
    return {
      state: this.state,
      errorCount: this.errorCount,
      nextAttempt: this.nextAttempt
    };
  }
}
