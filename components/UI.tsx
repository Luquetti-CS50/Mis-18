import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const NeonCard: React.FC<Props> = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`relative group rounded-xl p-[1px] silver-border-gradient-animated overflow-hidden ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}
  >
    {/* Se eliminó h-full para permitir que la tarjeta colapse según el contenido (height auto) */}
    <div className="bg-[#0A0A0A] w-full rounded-xl p-4 relative z-10">
      {children}
    </div>
  </div>
);

export const NeonButton: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, variant = 'primary', fullWidth, className = "", disabled }) => {
  const baseClasses = "font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-black border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black shadow-[0_0_10px_rgba(0,198,255,0.3)]",
    secondary: "bg-[#111] text-gray-300 border border-gray-700 hover:border-white hover:text-white",
    danger: "bg-black border border-red-500 text-red-500 hover:bg-red-500 hover:text-black",
    success: "bg-black border border-green-500 text-green-500 hover:bg-green-500 hover:text-black"
  };

  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; onRemove?: () => void }> = ({ children, onRemove }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#0A0A0A] border border-neon-blue text-neon-blue shadow-[0_0_5px_rgba(0,198,255,0.2)]">
    {children}
    {onRemove && (
      <button onClick={onRemove} className="ml-2 text-neon-blue hover:text-white focus:outline-none">
        ×
      </button>
    )}
  </span>
);

export const PageTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{title}</h1>
    {subtitle && <p className="text-neon-text text-sm">{subtitle}</p>}
  </div>
);