import React from "react";
import { User } from "firebase/auth";
import { LogOut, CheckCircle2, User as UserIcon, Loader2 } from "lucide-react";

interface GoogleAuthButtonProps {
  user: User | null;
  isLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  user,
  isLoading,
  onSignIn,
  onSignOut,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        <span>Connecting Google...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-2 bg-zinc-800/90 border border-zinc-700/80 rounded-xl px-2.5 py-1 text-xs text-zinc-200">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "Google Account"}
            className="w-5 h-5 rounded-full ring-1 ring-emerald-500/40"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
            {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
          </div>
        )}

        <div className="flex flex-col text-left max-w-[140px] truncate">
          <span className="font-semibold text-zinc-100 text-[11px] truncate">
            {user.displayName || user.email?.split("@")[0]}
          </span>
          <span className="text-[10px] text-emerald-400 flex items-center space-x-1 truncate">
            <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">Google Connected</span>
          </span>
        </div>

        <button
          id="btn-google-switch-account"
          type="button"
          onClick={onSignIn}
          title="Switch Google Account"
          className="text-[10px] text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700/60 px-1.5 py-0.5 rounded transition-colors ml-1 cursor-pointer"
        >
          Switch
        </button>

        <button
          id="btn-google-signout"
          type="button"
          onClick={onSignOut}
          title="Sign out of Google"
          className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-700/60 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      id="btn-google-signin"
      type="button"
      onClick={onSignIn}
      className="gsi-material-button flex items-center space-x-2 px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 font-medium text-xs rounded-xl shadow-sm border border-zinc-200 transition-all cursor-pointer select-none"
    >
      <div className="gsi-material-button-icon flex-shrink-0">
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="w-4 h-4"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
      </div>
      <span className="font-semibold text-zinc-900 tracking-tight">
        Sign in with Google
      </span>
    </button>
  );
};
