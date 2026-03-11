import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHuarongdaoService } from '../server';
import type { CreateHuarongdaoConfigInput, HuarongdaoConfig } from '../types';

export interface HuarongdaoRouteConfig {
  service?: ReturnType<typeof createHuarongdaoService>;
}

const resolveService = (config?: HuarongdaoRouteConfig) => config?.service || createHuarongdaoService();

export const createGetSnapshotHandler = (config?: HuarongdaoRouteConfig) => {
  const service = resolveService(config);
  return async (_req: NextRequest) => NextResponse.json({ success: true, data: service.getSnapshot() });
};

export const createListConfigsHandler = (config?: HuarongdaoRouteConfig) => {
  const service = resolveService(config);
  return async (_req: NextRequest) => NextResponse.json({ success: true, data: service.listConfigs() });
};

export const createCreateConfigHandler = (config?: HuarongdaoRouteConfig) => {
  const service = resolveService(config);
  return async (req: NextRequest) => {
    try {
      const body = (await req.json()) as CreateHuarongdaoConfigInput;
      const data = service.createConfig(body);
      return NextResponse.json({ success: true, data });
    } catch (e) {
      return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
    }
  };
};

export const createUpdateConfigHandler = (config?: HuarongdaoRouteConfig) => {
  const service = resolveService(config);
  return async (req: NextRequest) => {
    try {
      const body = (await req.json()) as { id: string; patch: Partial<HuarongdaoConfig> };
      const data = service.updateConfig(body.id, body.patch || {});
      return NextResponse.json({ success: true, data });
    } catch (e) {
      return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
    }
  };
};

export const createDeleteConfigHandler = (config?: HuarongdaoRouteConfig) => {
  const service = resolveService(config);
  return async (req: NextRequest) => {
    try {
      const body = (await req.json()) as { id: string };
      service.deleteConfig(body.id);
      return NextResponse.json({ success: true, data: true });
    } catch (e) {
      return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
    }
  };
};
