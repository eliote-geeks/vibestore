import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import '../../css/app.css';

// Import des composants layout
import Header from './layout/Header';
import Footer from './layout/Footer';
import TVLayout from './layout/TVLayout';
import PageTransition from './common/PageTransition';
import FloatingActionButton from './common/FloatingActionButton';

// Import des composants d'authentification
import Login from './auth/Login';
import Register from './auth/Register';
import ProtectedRoute from './auth/ProtectedRoute';

// Import des pages principales
import TVHome from './pages/TVHome';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';

// Import des pages de contenu
import Catalog from './pages/Catalog';
import Artists from './pages/Artists';
import ArtistProfile from './pages/ArtistProfile';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import About from './pages/About';

// Import des pages de compétitions
import Competitions from './pages/Competitions';
import CompetitionDetails from './pages/CompetitionDetails';
import CreateCompetition from './pages/CreateCompetition';
import LiveCompetition from './pages/LiveCompetition';

// Import des pages de clips vidéos
import ClipsVideos from './pages/ClipsVideos';
import ClipDetails from './pages/ClipDetails';
import AddClip from './pages/AddClip';

// Import des pages de détails
import SoundDetails from './pages/SoundDetails';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import AuthTest from './pages/AuthTest';

// Import des pages d'ajout/gestion
import AddSound from './pages/AddSound';
import AddEvent from './pages/AddEvent';
import EditSound from './pages/EditSound';
import EditEvent from './pages/EditEvent';
import Cart from './pages/Cart';
import TicketPurchase from './pages/TicketPurchase';
import Favorites from './pages/Favorites';
import SoundManagement from './pages/SoundManagement';

function App() {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Routes>
                {/* Route TV */}
                <Route path="/" element={
                    <TVLayout>
                        <TVHome />
                    </TVLayout>
                } />

                {/* Autres routes avec le layout standard */}
                <Route path="/*" element={
                    <>
                        <Header />
                        <main className="flex-grow-1">
                            <PageTransition>
                                <Routes>
                                    <Route path="/home" element={<Home />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/contact" element={<Contact />} />
                                    <Route path="/forgot-password" element={<ForgotPassword />} />
                                    <Route path="/auth-test" element={<AuthTest />} />

                                    {/* Pages de contenu publiques */}
                                    <Route path="/catalog" element={<Catalog />} />
                                    <Route path="/sounds/:id" element={<SoundDetails />} />
                                    <Route path="/artists" element={<Artists />} />
                                    <Route path="/artists/:id" element={<ArtistProfile />} />
                                    <Route path="/events" element={<Events />} />
                                    <Route path="/events/:id" element={<EventDetails />} />
                                    <Route path="/about" element={<About />} />
                                    <Route path="/categories" element={<Categories />} />
                                    <Route path="/category/:id" element={<CategoryDetail />} />

                                    {/* Pages de clips vidéos */}
                                    <Route path="/clips" element={<ClipsVideos />} />
                                    <Route path="/clips/:id" element={<ClipDetails />} />

                                    {/* Pages de compétitions */}
                                    <Route path="/competitions" element={<Competitions />} />
                                    <Route path="/competitions/:id" element={<CompetitionDetails />} />
                                    <Route path="/competitions/:id/live" element={<LiveCompetition />} />

                                    {/* Pages protégées - nécessitent une authentification */}
                                    <Route path="/dashboard" element={
                                        <ProtectedRoute requiredRoles={['admin']}>
                                            <Dashboard />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/admin/sounds" element={
                                        <ProtectedRoute requiredRoles={['admin']}>
                                            <SoundManagement />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/profile" element={
                                        <ProtectedRoute>
                                            <Profile />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/profile/edit" element={
                                        <ProtectedRoute>
                                            <ProfileEdit />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/cart" element={
                                        <ProtectedRoute>
                                            <Cart />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/mes-creations" element={
                                        <ProtectedRoute>
                                            <Favorites />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/favorites" element={
                                        <ProtectedRoute>
                                            <Favorites />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/ticket-purchase/:eventId" element={
                                        <ProtectedRoute>
                                            <TicketPurchase />
                                        </ProtectedRoute>
                                    } />

                                    {/* Pages protégées - artistes et producteurs uniquement */}
                                    <Route path="/add-sound" element={
                                        <ProtectedRoute requiredRoles={['artist', 'producer', 'admin']}>
                                            <AddSound />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/add-event" element={
                                        <ProtectedRoute requiredRoles={['artist', 'producer', 'admin']}>
                                            <AddEvent />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/add-clip" element={
                                        <ProtectedRoute requiredRoles={['artist', 'producer', 'admin']}>
                                            <AddClip />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/create-competition" element={
                                        <ProtectedRoute requiredRoles={['artist', 'producer', 'admin']}>
                                            <CreateCompetition />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/edit-sound/:id" element={
                                        <ProtectedRoute requiredRoles={['artist', 'producer', 'admin']}>
                                            <EditSound />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/edit-event/:id" element={
                                        <ProtectedRoute requiredRoles={['artist', 'producer', 'admin']}>
                                            <EditEvent />
                                        </ProtectedRoute>
                                    } />

                                    {/* Redirection par défaut */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </PageTransition>
                        </main>
                        <Footer />
                    </>
                } />
            </Routes>

            {/* Bouton flottant disponible sur toutes les pages */}
            <FloatingActionButton />
        </div>
    );
}

export default App;
