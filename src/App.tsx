import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useFriendsStore } from './store/friendsStore';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ListPage from './pages/ListPage';
import PantryPage from './pages/PantryPage';
import JoinPantryPage from './pages/JoinPantryPage';
import RecipesPage from './pages/RecipesPage';
import ShoppingListDetailPage from './pages/ShoppingListDetailPage';
import JoinListPage from './pages/JoinListPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CreateRecipePage from './pages/CreateRecipePage';
import ProfilePage from './pages/ProfilePage';
import ListMembersPage from './pages/ListMembersPage';
import PantryMembersPage from './pages/PantryMembersPage';
import SplashPage from './pages/SplashPage';

function InitialSplash() {
  const navigate = useNavigate();
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('splashShown');
    if (!hasSeenSplash) {
      sessionStorage.setItem('splashShown', 'true');
      navigate('/splash', { replace: true });
    }
  }, [navigate]);
  return null;
}

function ProtectedRoute() {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const { initialized, fetchFriends } = useFriendsStore.getState();
    if (!initialized) {
      fetchFriends();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const redirect = location.pathname !== '/'
      ? `?redirect=${encodeURIComponent(location.pathname)}`
      : '';
    return <Navigate to={`/login${redirect}`} replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <InitialSplash />
      <Routes>
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<ListPage />} />
            <Route path="/pantry" element={<PantryPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          {/* Full-screen flows — protected but no tab bar */}
          <Route path="/list/:id" element={<ShoppingListDetailPage />} />
          <Route path="/list/:id/members" element={<ListMembersPage />} />
          <Route path="/pantry/members" element={<PantryMembersPage />} />
          <Route path="/list/join/:token" element={<JoinListPage />} />
          <Route path="/pantry/join/:token" element={<JoinPantryPage />} />
          <Route path="/recipe/new" element={<CreateRecipePage />} />
          <Route path="/recipe/:id/edit" element={<CreateRecipePage />} />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
