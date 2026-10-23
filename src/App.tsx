import { Navigate, Route, Routes } from "react-router-dom";
import { DevHasilScreen } from "./screens/DevHasil";
import { FotoScreen } from "./screens/Foto";
import { HasilScreen } from "./screens/Hasil";
import { PertanyaanScreen } from "./screens/Pertanyaan";
import { PrioritasScreen } from "./screens/Prioritas";
import { ProfilScreen } from "./screens/Profil";
import { useStore } from "./state/store";

// Rute dev hanya ada saat `npm run dev` dengan foto tiruan; di build produksi kondisinya false dan kodenya terbuang.
const RUTE_DEV = import.meta.env.DEV && import.meta.env.VITE_PINDAI_MOCK === "true";

export function App() {
  const { state } = useStore();
  return (
    <Routes>
      <Route path="/" element={<FotoScreen />} />
      <Route path="/profil" element={state.areaId ? <ProfilScreen /> : <Navigate to="/" replace />} />
      <Route path="/prioritas" element={state.areaId ? <PrioritasScreen /> : <Navigate to="/" replace />} />
      <Route path="/pertanyaan" element={state.areaId && state.aktivitas ? <PertanyaanScreen /> : <Navigate to="/" replace />} />
      <Route path="/hasil" element={state.areaId ? <HasilScreen /> : <Navigate to="/" replace />} />
      {RUTE_DEV && <Route path="/dev/hasil" element={<DevHasilScreen />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
