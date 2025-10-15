/**
 * Performance monitoring utilities for authentication and profile operations
 */

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Start timing an operation
   */
  start(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      operation,
      startTime: performance.now(),
      success: false,
      metadata,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    return id;
  }

  /**
   * End timing an operation
   */
  end(id: string, success = true, error?: string): void {
    const metric = this.metrics.find(
      (m) =>
        `${m.operation}_${m.startTime}` ===
        id.split("_").slice(0, -2).join("_") + "_" + id.split("_")[1],
    );
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.success = success;
      if (error) metric.error = error;
    }
  }

  /**
   * Time an async operation
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const id = this.start(operation, metadata);
    try {
      const result = await fn();
      this.end(id, true);
      return result;
    } catch (error) {
      this.end(
        id,
        false,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalOperations: number;
    averageDuration: number;
    successRate: number;
    operationsByType: Record<
      string,
      {
        count: number;
        averageDuration: number;
        successRate: number;
      }
    >;
    recentSlowOperations: PerformanceMetric[];
  } {
    const completedMetrics = this.metrics.filter(
      (m) => m.duration !== undefined,
    );

    if (completedMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        successRate: 0,
        operationsByType: {},
        recentSlowOperations: [],
      };
    }

    const totalDuration = completedMetrics.reduce(
      (sum, m) => sum + m.duration!,
      0,
    );
    const successfulOperations = completedMetrics.filter(
      (m) => m.success,
    ).length;

    // Group by operation type
    const operationsByType: Record<string, PerformanceMetric[]> = {};
    completedMetrics.forEach((metric) => {
      if (!operationsByType[metric.operation]) {
        operationsByType[metric.operation] = [];
      }
      operationsByType[metric.operation].push(metric);
    });

    const operationsStats = Object.entries(operationsByType).reduce(
      (acc, [op, metrics]) => {
        const opSuccessful = metrics.filter((m) => m.success).length;
        const opTotalDuration = metrics.reduce(
          (sum, m) => sum + m.duration!,
          0,
        );

        acc[op] = {
          count: metrics.length,
          averageDuration: opTotalDuration / metrics.length,
          successRate: opSuccessful / metrics.length,
        };
        return acc;
      },
      {} as Record<
        string,
        { count: number; averageDuration: number; successRate: number }
      >,
    );

    // Find slow operations (over 200ms)
    const recentSlowOperations = completedMetrics
      .filter((m) => m.duration! > 200)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 10);

    return {
      totalOperations: completedMetrics.length,
      averageDuration: totalDuration / completedMetrics.length,
      successRate: successfulOperations / completedMetrics.length,
      operationsByType: operationsStats,
      recentSlowOperations,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  export(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Performance monitoring functions for auth/profile operations
 */
export const perf = {
  start: (operation: string, metadata?: Record<string, any>) =>
    performanceMonitor.start(operation, metadata),

  end: (id: string, success = true, error?: string) =>
    performanceMonitor.end(id, success, error),

  time: <T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ) => performanceMonitor.time(operation, fn, metadata),

  getStats: () => performanceMonitor.getStats(),

  clear: () => performanceMonitor.clear(),

  export: () => performanceMonitor.export(),
};

/**
 * Auth-specific performance monitoring
 */
export const authPerf = {
  /**
   * Time profile validation
   */
  timeProfileValidation: <T>(fn: () => Promise<T>, userId?: string) =>
    perf.time("profile_validation", fn, { userId }),

  /**
   * Time authentication flow
   */
  timeAuthFlow: <T>(fn: () => Promise<T>, userId?: string) =>
    perf.time("auth_flow", fn, { userId }),

  /**
   * Time profile loading
   */
  timeProfileLoad: <T>(fn: () => Promise<T>, userId?: string) =>
    perf.time("profile_load", fn, { userId }),

  /**
   * Time onboarding completion
   */
  timeOnboardingComplete: <T>(fn: () => Promise<T>, userId?: string) =>
    perf.time("onboarding_complete", fn, { userId }),
};

/**
 * Get performance health status
 */
export function getPerformanceHealth(): {
  status: "healthy" | "warning" | "critical";
  issues: string[];
  recommendations: string[];
} {
  const stats = perf.getStats();
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check average response times
  if (stats.averageDuration > 500) {
    issues.push(
      `High average response time: ${stats.averageDuration.toFixed(2)}ms`,
    );
    recommendations.push(
      "Consider optimizing database queries and adding caching",
    );
  }

  // Check success rate
  if (stats.successRate < 0.95) {
    issues.push(`Low success rate: ${(stats.successRate * 100).toFixed(1)}%`);
    recommendations.push("Investigate and fix failing operations");
  }

  // Check for slow operations
  if (stats.recentSlowOperations.length > 0) {
    issues.push(
      `${stats.recentSlowOperations.length} operations took over 200ms recently`,
    );
    recommendations.push("Review slow operations and optimize bottlenecks");
  }

  // Check profile validation performance
  const profileValidation = stats.operationsByType["profile_validation"];
  if (profileValidation && profileValidation.averageDuration > 100) {
    issues.push(
      `Slow profile validation: ${profileValidation.averageDuration.toFixed(2)}ms average`,
    );
    recommendations.push("Consider using cached validation results");
  }

  let status: "healthy" | "warning" | "critical" = "healthy";
  if (issues.length > 2) {
    status = "critical";
  } else if (issues.length > 0) {
    status = "warning";
  }

  return { status, issues, recommendations };
}
