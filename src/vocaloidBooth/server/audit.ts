import type { BoothAuditEvent } from '../types';

export interface BoothAuditSink {
  log(event: BoothAuditEvent): Promise<void> | void;
}

export class InMemoryBoothAuditSink implements BoothAuditSink {
  private readonly events: BoothAuditEvent[] = [];

  log(event: BoothAuditEvent): void {
    this.events.push(event);
  }

  list(): BoothAuditEvent[] {
    return [...this.events];
  }
}

export const createAuditLogger = (sink: BoothAuditSink) => {
  return (event: BoothAuditEvent): void => {
    sink.log(event);
  };
};
