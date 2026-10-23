import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { AWAL, reducer, type Aksi, type State } from "./reducer";

interface Nilai {
  state: State;
  kirim: Dispatch<Aksi>;
}

const Konteks = createContext<Nilai | null>(null);

export function StoreProvider({ children, awal = AWAL }: { children: ReactNode; awal?: State }) {
  const [state, kirim] = useReducer(reducer, awal);
  const nilai = useMemo(() => ({ state, kirim }), [state, kirim]);
  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function useStore(): Nilai {
  const n = useContext(Konteks);
  if (!n) throw new Error("useStore harus di dalam StoreProvider");
  return n;
}
