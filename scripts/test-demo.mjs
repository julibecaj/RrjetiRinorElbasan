// Exercise the actual TypeScript reducer without installing a test framework.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const cache = new Map();
function load(file) {
  const filename = path.resolve(file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const localRequire = (name) => {
    if (name.startsWith("@/"))
      return load(path.join("src", `${name.slice(2)}.ts`));
    if (name.startsWith("."))
      return load(path.resolve(path.dirname(filename), `${name}.ts`));
    throw new Error(`Unexpected external dependency in demo state: ${name}`);
  };
  new Function("require", "module", "exports", code)(
    localRequire,
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
}
const {
  demoReducer: reduce,
  initialState,
  userPoints,
  occupiedPlaces,
} = load("src/lib/demo-state.ts");
let state = reduce(initialState, { type: "login", userId: "u1" });
const application = {
  id: "test-application",
  userId: "u1",
  eventId: "ai-workshop",
  date: "2026-09-28",
  status: "pending",
  motivation: "Dua të marr pjesë në workshop.",
};
state = reduce(state, { type: "apply", application });
assert.equal(
  state.applications.find((a) => a.id === application.id).status,
  "pending",
);
const afterApply = state;
assert.equal(
  reduce(state, {
    type: "apply",
    application: { ...application, id: "duplicate" },
  }),
  state,
  "Duplicate applications must not be added",
);
assert.equal(
  reduce(state, {
    type: "application-status",
    id: application.id,
    status: "attended",
  }),
  state,
  "Pending applications cannot award points",
);
state = reduce(state, {
  type: "application-status",
  id: application.id,
  status: "accepted",
});
assert.equal(
  occupiedPlaces(state, "ai-workshop"),
  occupiedPlaces(afterApply, "ai-workshop") + 1,
);
const startingPoints = userPoints(state, "u1");
state = reduce(state, {
  type: "application-status",
  id: application.id,
  status: "attended",
});
assert.equal(userPoints(state, "u1"), startingPoints + 20);
assert.equal(
  state.applications.find((a) => a.id === application.id).awardedPoints,
  20,
);
assert.equal(
  reduce(state, {
    type: "application-status",
    id: application.id,
    status: "attended",
  }),
  state,
  "Attendance is idempotent",
);
assert.equal(
  reduce(state, {
    type: "application-status",
    id: application.id,
    status: "rejected",
  }),
  state,
  "Awarded attendance cannot be rewritten",
);

const event = {
  ...state.events[0],
  id: "test-event",
  title: "Test community event",
  capacity: 1,
};
state = reduce(state, { type: "event", event });
state = reduce(state, {
  type: "apply",
  application: { ...application, id: "capacity-1", eventId: event.id },
});
state = reduce(state, {
  type: "apply",
  application: {
    ...application,
    id: "capacity-2",
    eventId: event.id,
    userId: "u2",
  },
});
state = reduce(state, {
  type: "application-status",
  id: "capacity-1",
  status: "accepted",
});
assert.equal(
  reduce(state, {
    type: "application-status",
    id: "capacity-2",
    status: "accepted",
  }),
  state,
  "Approvals cannot exceed capacity",
);
assert.equal(
  reduce(state, {
    type: "apply",
    application: {
      ...application,
      id: "capacity-3",
      eventId: event.id,
      userId: "u3",
    },
  }),
  state,
  "Full events cannot receive applications",
);
state = reduce(state, {
  type: "event",
  event: { ...event, status: "cancelled", capacity: 10 },
});
assert.equal(
  reduce(state, {
    type: "apply",
    application: {
      ...application,
      id: "archived",
      eventId: event.id,
      userId: "u3",
    },
  }),
  state,
  "Archived events cannot receive applications",
);
assert.equal(
  reduce(state, {
    type: "application-status",
    id: "capacity-1",
    status: "attended",
  }),
  state,
  "Archived events cannot award attendance points",
);

const newUser = {
  id: "test-user",
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  phone: "+355 690000000",
  joined: "2026-09-28",
};
state = reduce(state, { type: "register", user: newUser });
assert.equal(state.currentUserId, newUser.id);
assert.equal(
  reduce(state, {
    type: "register",
    user: { ...newUser, id: "duplicate-user" },
  }),
  state,
  "Duplicate email registration must not overwrite a profile",
);
state = reduce(state, { type: "logout" });
assert.equal(state.currentUserId, null);
assert.ok(
  state.users.some((u) => u.id === newUser.id),
  "Logout retains demo data",
);
assert.equal(reduce(state, { type: "reset" }), initialState);
assert.equal(
  initialState.applications.length,
  6,
  "Actions do not mutate initial data",
);
console.log(
  "PASS: application lifecycle, duplicate prevention, attendance points, capacity, archives, registration, logout, and reset",
);
