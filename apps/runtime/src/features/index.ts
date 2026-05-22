import type { FeatureModule } from "@bot/core";
import { examplesFeature } from "./examples";
import { systemFeature } from "./system";

export const features: FeatureModule[] = [systemFeature, examplesFeature];
