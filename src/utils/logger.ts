import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: unknown;
}

export class Logger {
  private _level: LogLevel = 'info';
  private _component: string;

  constructor(component: string) {
    this._component = component;
  }

  setLevel(level: LogLevel): void {
    this._level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this._level);
  }

  private formatEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      component: this._component,
      message,
      data,
    };
  }

  private output(entry: LogEntry): void {
    const colorMap: Record<LogLevel, (s: string) => string> = {
      debug: chalk.gray,
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red,
    };

    const color = colorMap[entry.level];
    const prefix = color(`[${entry.level.toUpperCase()}]`);
    const timestamp = chalk.dim(entry.timestamp);
    const component = chalk.cyan(`[${entry.component}]`);

    console.log(`${timestamp} ${prefix} ${component} ${entry.message}`);

    if (entry.data) {
      console.log(chalk.dim(JSON.stringify(entry.data, null, 2)));
    }
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatEntry('debug', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      this.output(this.formatEntry('info', message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatEntry('warn', message, data));
    }
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog('error')) {
      this.output(this.formatEntry('error', message, data));
    }
  }

  child(subComponent: string): Logger {
    return new Logger(`${this._component}:${subComponent}`);
  }
}

export function createLogger(component: string): Logger {
  return new Logger(component);
}

export const logger = createLogger('reflex');
