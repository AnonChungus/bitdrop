import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet.js';

export function Navbar(): JSX.Element {
    const { wallet, connect, disconnect } = useWallet();
    const { pathname } = useLocation();

    const navLink = (to: string, label: string): JSX.Element => (
        <Link
            to={to}
            className={`text-sm font-medium transition-colors ${
                pathname === to
                    ? 'text-bd-purple-lt'
                    : 'text-bd-muted hover:text-bd-text'
            }`}
        >
            {label}
        </Link>
    );

    return (
        <header className="border-b border-bd-border bg-bd-card/60 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <span className="text-2xl">🪂</span>
                    <span className="font-bold text-lg text-bd-text">
                        Bit<span className="text-bd-purple-lt">Drop</span>
                    </span>
                </Link>

                {/* Nav links */}
                <nav className="hidden sm:flex items-center gap-6">
                    {navLink('/discover', 'Discover')}
                    {navLink('/create', 'Create Airdrop')}
                    {wallet.connected &&
                        navLink(`/profile/${wallet.address}`, 'My Campaigns')}
                </nav>

                {/* Wallet */}
                <div className="flex items-center gap-3">
                    {wallet.connected ? (
                        <div className="flex items-center gap-2">
                            <span className="hidden sm:block text-xs text-bd-muted font-mono">
                                {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
                            </span>
                            <span className="text-xs bg-bd-purple/20 text-bd-purple-lt px-2 py-0.5 rounded-full">
                                {wallet.network}
                            </span>
                            <button
                                onClick={disconnect}
                                className="text-xs text-bd-muted hover:text-bd-danger transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => void connect()}
                            className="bg-bd-purple hover:bg-bd-purple-dk text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
