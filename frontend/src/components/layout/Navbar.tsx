import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet.js';

export function Navbar(): JSX.Element {
    const { wallet, connect, disconnect } = useWallet();
    const { pathname } = useLocation();

    const navLink = (to: string, label: string): JSX.Element => (
        <Link
            to={to}
            className={`text-xs font-display tracking-widest uppercase transition-all ${
                pathname === to
                    ? 'text-od-pink neon-pink'
                    : 'text-od-muted hover:text-od-cyan'
            }`}
        >
            {label}
        </Link>
    );

    return (
        <header className="border-b border-od-border bg-od-card/80 backdrop-blur-sm sticky top-0 z-50"
            style={{ boxShadow: '0 2px 20px rgba(255,45,120,0.1)' }}>
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-xl flicker">📡</span>
                    <span className="font-display font-black text-base tracking-widest">
                        <span className="neon-pink">OP</span>
                        <span className="neon-cyan">DROP</span>
                    </span>
                    <span className="hidden sm:block text-xs text-od-muted/60 font-mono ml-1">OP20 Airdrops on Bitcoin</span>
                </Link>

                {/* Nav links */}
                <nav className="hidden sm:flex items-center gap-8">
                    {navLink('/airdrops', 'All Airdrops')}
                    {navLink('/create', 'New Airdrop')}
                    {wallet.connected && navLink(`/profile/${wallet.address}`, 'My Airdrops')}
                </nav>

                {/* Wallet */}
                <div className="flex items-center gap-3">
                    {wallet.connected ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs font-mono text-od-cyan">
                                    {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
                                </p>
                                <p className="text-xs text-od-muted font-mono">Taproot · OPNet</p>
                            </div>
                            <span className="text-xs border border-od-green text-od-green px-2 py-0.5 rounded font-mono"
                                style={{ textShadow: '0 0 6px #39FF14' }}>
                                {wallet.network.toUpperCase()}
                            </span>
                            <button
                                onClick={disconnect}
                                className="text-xs text-od-muted hover:text-od-pink transition-colors font-mono"
                            >
                                [disconnect]
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => void connect()}
                            className="btn-neon-pink font-display text-xs font-bold px-4 py-2 rounded tracking-widest uppercase"
                        >
                            SIGN IN
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
