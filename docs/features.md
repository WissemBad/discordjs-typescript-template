# Features

A feature is a folder with an `index.ts` manifest:

```ts
import type { FeatureModule } from "@bot/core";

export const myFeature: FeatureModule = {
  name: "my-feature",
  description: "Does one thing well.",
  commands: [],
  components: [],
  selects: [],
  modals: [],
  routes: [],
};
```

Keep feature code private to that folder. Shared behavior belongs in one of the packages only if it is stable enough to be reused by unrelated features.

## Custom IDs

Use `formatCustomId`:

```ts
formatCustomId({ feature: "my-feature", scope: "button", action: "open", id: "123" });
```

Handlers register routes by `feature:scope:action`, so dynamic ids are available without creating a handler per row.

## Guards

Use guards on definitions:

- `guards.guildOnly()`
- `guards.adminOnly()`
- `guards.devOnly()`
- `guards.requiredPermissions(...)`

Feature handlers should not duplicate permission checks that already exist as guards.
