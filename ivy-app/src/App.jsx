import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { FavouritesProvider } from "./context/FavouritesContext";
import Nav from "./components/Nav";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import Rentals from "./pages/Rentals";
import RentalDetail from "./pages/RentalDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Favourites from "./pages/Favourites";
import Insights from "./pages/Insights";

function withProviders(children) {
  return (
    <AuthProvider>
      <DataProvider>
        <FavouritesProvider>{children}</FavouritesProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {withProviders(
        <>
          <Nav />
          <main className="app-main">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/listings" replace />} />
              <Route path="/listings" element={<ProtectedRoute><Listings /></ProtectedRoute>} />
              <Route path="/listings/:listingId" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
              <Route path="/rentals" element={<ProtectedRoute><Rentals /></ProtectedRoute>} />
              <Route path="/rentals/:listingId" element={<ProtectedRoute><RentalDetail /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
              <Route path="/favourites" element={<ProtectedRoute><Favourites /></ProtectedRoute>} />
              <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
            </Routes>
          </main>
        </>
      )}
    </BrowserRouter>
  );
}
