/**
 * LogManager - Utility for managing log entries with memory management and auto-scrolling
 *
 * Features:
 * - Manages log entries with automatic cleanup of old entries
 * - Provides reactive log store for Svelte components
 * - Supports different log levels (info, success, warning, error)
 * - Auto-scrolling support for log viewers
 * - Memory-efficient with configurable max entries
 */

import { writable, type Writable } from "svelte/store";

export interface LogEntry {
  id: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface LogManagerOptions {
  maxEntries?: number;
  autoScroll?: boolean;
}

export class LogManager {
  private logs: Writable<LogEntry[]>;
  private maxEntries: number;
  private autoScroll: boolean;

  constructor(options: LogManagerOptions = {}) {
    this.maxEntries = options.maxEntries ?? 100;
    this.autoScroll = options.autoScroll ?? true;
    this.logs = writable<LogEntry[]>([]);
  }

  /**
   * Get the logs store for reactive updates
   */
  get store(): Writable<LogEntry[]> {
    return this.logs;
  }

  /**
   * Add a new log entry
   */
  addLog(
    message: string,
    level: LogEntry["level"] = "info",
    metadata?: Record<string, any>,
  ): void {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      message,
      level,
      timestamp: new Date(),
      metadata,
    };

    this.logs.update((currentLogs) => {
      const newLogs = [...currentLogs, entry];

      // Remove old entries if we exceed maxEntries
      if (newLogs.length > this.maxEntries) {
        return newLogs.slice(-this.maxEntries);
      }

      return newLogs;
    });
  }

  /**
   * Add an info log entry
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.addLog(message, "info", metadata);
  }

  /**
   * Add a success log entry
   */
  success(message: string, metadata?: Record<string, any>): void {
    this.addLog(message, "success", metadata);
  }

  /**
   * Add a warning log entry
   */
  warning(message: string, metadata?: Record<string, any>): void {
    this.addLog(message, "warning", metadata);
  }

  /**
   * Add an error log entry
   */
  error(message: string, metadata?: Record<string, any>): void {
    this.addLog(message, "error", metadata);
  }

  /**
   * Clear all log entries
   */
  clear(): void {
    this.logs.set([]);
  }

  /**
   * Get current log entries (non-reactive)
   */
  getLogs(): LogEntry[] {
    let currentLogs: LogEntry[] = [];
    this.logs.subscribe((logs) => (currentLogs = logs))();
    return currentLogs;
  }

  /**
   * Get the number of log entries
   */
  get count(): number {
    return this.getLogs().length;
  }

  /**
   * Check if auto-scrolling is enabled
   */
  get isAutoScrollEnabled(): boolean {
    return this.autoScroll;
  }

  /**
   * Enable or disable auto-scrolling
   */
  setAutoScroll(enabled: boolean): void {
    this.autoScroll = enabled;
  }

  /**
   * Create a scroll handler for log containers
   */
  createScrollHandler(container: HTMLElement): () => void {
    return () => {
      if (this.autoScroll && container) {
        container.scrollTop = container.scrollHeight;
      }
    };
  }
}

/**
 * Create a new LogManager instance
 */
export function createLogManager(options?: LogManagerOptions): LogManager {
  return new LogManager(options);
}

/**
 * Default log manager instance for global use
 */
export const defaultLogManager = createLogManager();
