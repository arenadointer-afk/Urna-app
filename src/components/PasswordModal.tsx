import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ADMIN_PASSWORD = '851985';

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xs bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3">
          <KeyRound className="w-6 h-6" />
        </div>

        <h3 className="text-base font-black text-white uppercase tracking-tight font-digital">
          Painel ADM Protegido
        </h3>
        <p className="text-xs text-slate-400 mt-1 mb-3">
          Digite a senha de administrador para acessar os controles:
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={password}
              onChange={(e) => {
                setError(false);
                setPassword(e.target.value.replace(/\D/g, ''));
              }}
              placeholder="Digite a senha (6 dígitos)"
              autoFocus
              className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-digital tracking-widest text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Senha padrão: <strong className="text-amber-400 font-digital">851985</strong></span>
            <button
              type="button"
              onClick={() => {
                setPassword(ADMIN_PASSWORD);
                setError(false);
              }}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              Preencher Senha
            </button>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-bold animate-shake">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Senha incorreta! Tente novamente.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setPassword('');
                setError(false);
                onClose();
              }}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer shadow active:scale-95 transition-all"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
