import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import AppLayout from './components/AppLayout';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';

import HomePage from './pages/HomePage';
import PlacesPage from './pages/PlacesPage';
import RecipesPage from './pages/RecipesPage';
import VersionHistoryPage from './pages/VersionHistoryPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter basename="/lile">
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/ruokapaikat"
            element={
              <RequireAuth>
                <PlacesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reseptit"
            element={
              <RequireAuth>
                <RecipesPage />
              </RequireAuth>
            }
          />
          <Route path="/versiohistoria" element={<VersionHistoryPage />} />
          <Route path="/kirjaudu" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
