"use client";

import { FaDiscord } from "react-icons/fa";

export function CommentFormGuestOverlay() {
  const handleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/discord`;
  };

  return (
    <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-ohara-dark/75 rounded-2xl flex flex-col items-center justify-center p-6 text-center gap-3.5">
      <p className="text-sm sm:text-base font-medium text-gray-200 max-w-md leading-relaxed">
        Faça parte da conversa. Entre com o Discord para comentar nesta publicação.
      </p>

      <button
        type="button"
        onClick={handleLogin}
        className="cursor-pointer flex items-center gap-2.5 px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
        style={{
          background:
            "linear-gradient(135deg, var(--color-ohara-pink, #d946ef), var(--color-ohara-orange, #fb923c))",
          boxShadow:
            "0 0 20px 2px color-mix(in srgb, var(--color-ohara-pink, #d946ef) 35%, transparent)",
        }}
      >
        <FaDiscord size={18} />
        <span>Entrar com Discord</span>
      </button>
    </div>
  );
}
