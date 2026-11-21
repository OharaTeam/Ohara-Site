"use client";

import { useAuth } from '@/app/_context/AuthContext';
import { useProfile } from '@/app/_hooks/useProfile';
import { useParams, usePathname } from 'next/navigation';
import { useNotification } from '@/app/_context/NotificationContext';
import Toast from '@/app/components/Toast';
import { Share2, Edit3, Calendar, ShieldCheck, Info, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import EditProfileModal from '@/app/components/EditProfileModal';
import SocialIcon from '@/app/components/SocialIcons';
import SteamProfile from '@/app/components/SteamProfile';

export default function ProfilePage() {
    const pathname = usePathname();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [pathname]);

    const { notify } = useNotification();
    const params = useParams();
    const discordId = params.discordId as string;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { profile, loading, error, reload } = useProfile(discordId);
    const { user: loggedUser } = useAuth();
    const [copied, setCopied] = useState(false);
    const [showToast, setShowToast] = useState<React.ReactNode>(null);
    const isOwner = loggedUser?.discordId === profile?.discordId;
    const userColor = profile?.colorHex || '#8b5cf6';

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            notify("Link do perfil copiado!", "success", userColor);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Falha ao copiar o link: ', err);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-ohara-blue border-t-transparent rounded-full mb-4"></div>
                <p className="text-ohara-blue animate-pulse font-medium">Carregando perfil...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="bg-red-500/10 p-4 rounded-full mb-4">
                    <Info className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Ops! Perfil não encontrado</h2>
                <p className="text-gray-400 max-w-xs">O membro que você procura não existe ou a API está temporariamente fora do ar.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ohara-dark py-8 px-4 selection:bg-ohara-pink/30">

            {/* Wrapper único com borda dinâmica — engloba banner + todo o conteúdo */}
            <div
                className="max-w-4xl mx-auto rounded-3xl overflow-hidden pb-8"
                style={{ border: `1px solid ${userColor}40` }}
            >

                {/* ── BANNER ── */}
                <div className="relative w-full h-52 md:h-80 overflow-hidden">
                    {/* Camada 1: Fundo desfocado */}
                    <div
                        className="absolute inset-0 scale-110 blur-3xl opacity-60 transition-all duration-700"
                        style={{
                            backgroundImage: profile.serverBannerUrl
                                ? `url(${profile.serverBannerUrl})`
                                : profile.bannerUrl
                                    ? `url(${profile.bannerUrl})`
                                    : 'none',
                            backgroundColor: userColor,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    {/* Camada 2: Imagem real */}
                    <div
                        className="absolute inset-0 bg-no-repeat bg-cover md:bg-contain bg-center transition-all duration-500"
                        style={{
                            backgroundImage: profile.serverBannerUrl
                                ? `url(${profile.serverBannerUrl})`
                                : profile.bannerUrl
                                    ? `url(${profile.bannerUrl})`
                                    : 'none',
                        }}
                    />
                    {/* Camada 3: Gradiente de fusão */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-ohara-dark" />
                </div>

                {/* ── CONTEÚDO ── */}
                <div className="px-6 md:px-8">

                    {/* Avatar + Identidade — sobe sobre o banner */}
                    <div className="-mt-20 md:-mt-28">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-6">

                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div
                                    className="w-36 h-36 md:w-44 md:h-44 rounded-full p-[3px] transition-all duration-500"
                                    style={{
                                        background: `linear-gradient(135deg, ${userColor}, ${userColor}88)`,
                                        boxShadow: `0 0 0 4px #0d0f14, 0 8px 40px ${userColor}55`,
                                    }}
                                >
                                    <img
                                        src={profile.serverAvatarUrl || profile.avatarUrl}
                                        alt={profile.username}
                                        className="w-full h-full object-cover rounded-full border-[3px] border-ohara-dark"
                                    />
                                </div>
                            </div>

                            {/* Nome + Ações */}
                            <div className="flex-1 flex flex-col md:flex-row items-center md:items-end justify-between w-full gap-4 pb-1">

                                {/* Nome */}
                                <div className="text-center md:text-left">
                                    <div className="flex items-center gap-2 justify-center md:justify-start">
                                        <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                                            {profile.serverNickName || profile.globalName || profile.username}
                                        </h1>
                                        {profile.isBot && (
                                            <span className="bg-ohara-blue/20 text-ohara-blue text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-ohara-blue/30 self-center">
                                                BOT
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 font-mono mt-0.5">@{profile.username}</p>
                                </div>

                                {/* Redes sociais + Editar Bio + Compartilhar */}
                                <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">

                                    {profile.profile?.socialLinks &&
                                        Object.entries(profile.profile.socialLinks).map(([platform, url]) => {
                                            if (!url) return null;
                                            return (
                                                <a
                                                    key={platform}
                                                    href={url as string}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={platform}
                                                    className="relative group w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border transition-all duration-200 hover:scale-110 hover:bg-white/10 active:scale-95"
                                                    style={{ borderColor: `${userColor}44` }}
                                                >
                                                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity blur-sm" style={{ backgroundColor: userColor }} />
                                                    <div className="relative z-10">
                                                        <SocialIcon platform={platform} />
                                                    </div>
                                                </a>
                                            );
                                        })}

                                    {isOwner && (
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="cursor-pointer px-4 py-2 text-white text-sm font-bold rounded-xl hover:scale-105 transition-all active:scale-95 flex items-center gap-1.5"
                                            style={{ background: `linear-gradient(135deg, ${userColor}cc, ${userColor})` }}
                                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 12px ${userColor}88`; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Editar Bio
                                        </button>
                                    )}

                                    <button
                                        onClick={handleShare}
                                        className={`cursor-pointer p-2 rounded-xl transition-all border flex items-center gap-2 ${copied
                                            ? 'bg-green-500/20 border-green-500 text-green-500'
                                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                            }`}
                                        title="Copiar link do perfil"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {profile.profile?.bio && (
                        <div className="mt-8 relative max-w-2xl p-2 shadow-sm transition-all duration-300 hover:bg-white/4 hover:border-white/10 group">
                            {/* Barra lateral sutíl com a cor do usuário (efeito neon/glow) */}
                            <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-[70%] w-1 rounded-r-full transition-all duration-300 group-hover:h-[80%]"
                                style={{
                                    backgroundColor: userColor,
                                    boxShadow: `0 0 12px ${userColor}60`
                                }}
                            />

                            {/* Conteúdo da bio */}
                            <p className="relative z-10 text-gray-300 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap pl-3 text-center md:text-left">
                                {profile.profile.bio}
                            </p>
                        </div>
                    )}

                    {/* Divisória */}
                    <div className="mt-6 mb-5 h-px w-full opacity-20 rounded-full" style={{ backgroundColor: userColor }} />

                    {/* Cargos */}
                    {profile.roles && profile.roles.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-5">
                            <span className="text-[10px] uppercase tracking-widest text-gray-300 font-bold mr-1">Cargos</span>
                            {profile.roles.map((role) => (
                                <span
                                    key={role.name}
                                    className="px-2 py-0.5 rounded-md bg-black/30 text-[10px] font-semibold border border-white/5 transition-transform hover:scale-105"
                                    style={{ borderLeftColor: role.colorHex, borderLeftWidth: '2px', color: role.colorHex }}
                                >
                                    {role.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Divisória */}
                    <div className="mb-5 h-px w-full opacity-20 rounded-full" style={{ backgroundColor: userColor }} />

                    <div className='min-h-[80px] mb-5'>
                        <SteamProfile profile={profile} onProfileUpdated={reload} />
                    </div>

                    {/* Divisória */}
                    <div className="mb-5 h-px w-full opacity-20 rounded-full" style={{ backgroundColor: userColor }} />

                    {/* Estatísticas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatBox
                            icon={<Calendar className="w-4 h-4" style={{ color: userColor }} />}
                            label="Entrou no servidor em"
                            value={new Date(profile.joinedServerAt).toLocaleDateString('pt-BR')}
                            userColor={userColor}
                        />
                        <StatBox
                            icon={<ShieldCheck className="w-4 h-4" style={{ color: userColor }} />}
                            label="Cargos no Discord"
                            value={`${profile.roles.length} Atribuições`}
                            userColor={userColor}
                        />
                    </div>

                </div>{/* fim conteúdo */}
            </div>{/* fim wrapper com borda */}

            {isEditModalOpen && (
                <EditProfileModal
                    profile={profile}
                    userColor={userColor}
                    onClose={() => setIsEditModalOpen(false)}
                    onRefresh={reload}
                />
            )}

            {showToast && (
                <Toast
                    message="Link do perfil copiado!"
                    type="success"
                    onClose={() => setShowToast(null)}
                    color={userColor}
                />
            )}
        </div>
    );
}

function StatBox({
    icon,
    label,
    value,
    userColor,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    userColor: string;
}) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] transition-all hover:bg-white/[0.06]">
            <div className="p-2 rounded-xl border border-white/5" style={{ backgroundColor: `${userColor}18` }}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</p>
                <p className="text-sm text-white font-mono">{value}</p>
            </div>
        </div>
    );
}