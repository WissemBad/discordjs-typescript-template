import type { FeatureModule } from "@bot/core";
import { componentsCommand } from "./commands/components.command";
import { echoCommand } from "./commands/echo.command";
import { pingCommand } from "./commands/ping.command";
import { demoButtonComponent } from "./components/demo-button.component";
import { demoSelectComponent } from "./components/demo-select.component";
import { demoModal } from "./modals/demo.modal";
import { exampleRoutes } from "./routes/example.routes";

/** Reference feature showing every extension point a new bot feature can use. */
export const examplesFeature: FeatureModule = {
  commands: [pingCommand, echoCommand, componentsCommand],
  components: [demoButtonComponent],
  description: "Complete examples for commands, components, modals, API routes and Prisma.",
  modals: [demoModal],
  name: "examples",
  routes: [exampleRoutes],
  selects: [demoSelectComponent],
};
