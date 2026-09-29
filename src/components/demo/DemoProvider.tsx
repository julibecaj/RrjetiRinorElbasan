"use client";
import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  demoReducer,
  initialState,
  type DemoAction,
  type DemoState,
} from "@/lib/demo-state";
const DemoContext = createContext<{
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
} | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, initialState);
  return (
    <DemoContext.Provider value={{ state, dispatch }}>
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be inside DemoProvider");
  return context;
}
