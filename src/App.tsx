import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import ListPage from './pages/ListPage';
import PantryPage from './pages/PantryPage';
import RecipesPage from './pages/RecipesPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<ListPage />} />
          <Route path="/pantry" element={<PantryPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
