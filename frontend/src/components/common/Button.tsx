interface ButtonProps {
    readonly children: React.ReactNode;
    readonly onClick?: () => void;
    readonly type?: 'button' | 'submit';
    readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    readonly size?: 'sm' | 'md' | 'lg';
    readonly disabled?: boolean;
    readonly loading?: boolean;
    readonly className?: string;
}

const variants: Record<string, string> = {
    primary:   'bg-bd-purple hover:bg-bd-purple-dk text-white',
    secondary: 'bg-bd-border hover:bg-[#2A2A3E] text-bd-text',
    danger:    'bg-bd-danger/20 hover:bg-bd-danger/30 text-bd-danger',
    ghost:     'hover:bg-bd-border text-bd-muted hover:text-bd-text',
};

const sizes: Record<string, string> = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
};

export function Button({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
}: ButtonProps): JSX.Element {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                inline-flex items-center justify-center gap-2 font-semibold rounded-lg
                transition-all duration-150 cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variants[variant] ?? variants['primary']}
                ${sizes[size] ?? sizes['md']}
                ${className}
            `}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    );
}
