import { Navigate, Route, Routes } from "react-router-dom";
import { FotoScreen } from "./screens/Foto";
import { HasilScreen } from "./screens/Hasil";
import { PertanyaanScreen } from "./screens/Pertanyaan";
import { PrioritasScreen } from "./screens/Prioritas";
import { ProfilScreen } from "./screens/Profil";
import { useStore } from "./state/store";

export function App() {
  const { state } = useStore();
  return (
    <Routes>
      <Route path="/" element={<FotoScreen />} />
      <Route path="/profil" element={state.areaId ? <ProfilScreen /> : <Navigate to="/" replace />} />
      <Route path="/prioritas" element={state.areaId ? <PrioritasScreen /> : <Navigate to="/" replace />} />
      <Route path="/pertanyaan" element={state.areaId && state.aktivitas ? <PertanyaanScreen /> : <Navigate to="/" replace />} />
      <Route path="/hasil" element={state.areaId ? <HasilScreen /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
