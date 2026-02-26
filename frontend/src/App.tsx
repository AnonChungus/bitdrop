import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar.js';
import { HomePage } from './pages/HomePage.js';
import { DiscoverPage } from './pages/DiscoverPage.js';
import { CreatePage } from './pages/CreatePage.js';
import { CampaignPage } from './pages/CampaignPage.js';
import { ProfilePage } from './pages/ProfilePage.js';

export function App(): JSX.Element {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-bd-bg text-bd-text">
                <Navbar />
                <main>
                    <Routes>
                        <Route path="/"                   element={<HomePage />} />
                        <Route path="/discover"           element={<DiscoverPage />} />
                        <Route path="/create"             element={<CreatePage />} />
                        <Route path="/campaign/:id"       element={<CampaignPage />} />
                        <Route path="/profile/:addr"      element={<ProfilePage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}
