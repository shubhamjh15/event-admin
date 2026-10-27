import "server-only";
import * as M from "./models";
import { resourceMap } from "./resources";

export function getResource(key: string) {
  const resource = resourceMap[key];
  if (!resource) return null;
  const model = (M as any)[resource.model];
  return model ? { resource, model } : null;
}
