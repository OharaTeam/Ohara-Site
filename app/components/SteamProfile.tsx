"use client";
import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/_context/AuthContext";
import { useNotification } from "@/app/_context/NotificationContext";
import { useSteamProfile, SteamGame } from "@/app/_hooks/useSteamProfile";
import { MemberProfile } from "@/app/_hooks/useProfile";
import {
    Gamepad2,
    Clock,
    ExternalLink,
    GripVertical,
    X,
    Save,
    Loader2,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Trophy,
} from "lucide-react";
import { ImSteam } from "react-icons/im";

/* ─── tiny drag-and-drop helper (no lib needed) ─── */
function reorder<T>(list: T[], from: number, to: number): T[] {
    const result = [...list];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
}

interface SteamProfileProps {
    profile?: MemberProfile | null;
    onProfileUpdated?: () => Promise<void> | void;
}

export default function SteamProfile({ profile, onProfileUpdated }: SteamProfileProps = {}) {
    const params = useParams();
    const discordId = params.discordId as string;
    const { user } = useAuth();
    const { notify } = useNotification();
    const isOwner = user?.discordId === discordId;

    const hasSteamConnection = profile?.connections?.some((c: any) => c.provider === 'steam') ?? false;

    const { summary, loading, error, fetchGames, saveShowcase, registerSteam } = useSteamProfile(discordId);

    /* ── edit mode state ── */
    const [editing, setEditing] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [steamUrlInput, setSteamUrlInput] = useState("");
    const [allGames, setAllGames] = useState<SteamGame[]>([]);
    const [showcase, setShowcase] = useState<SteamGame[]>([]);
    const [loadingGames, setLoadingGames] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dragging, setDragging] = useState<number | null>(null);
    const [dragOver, setDragOver] = useState<number | null>(null);
    const [isPrivate, setIsPrivate] = useState(false);
    const [expanded, setExpanded] = useState(false);

    /* ── open edit panel ── */
    const handleOpenEdit = useCallback(async () => {
        setLoadingGames(true);
        setEditing(true);
        const data = await fetchGames();
        setLoadingGames(false);
        if (!data) {
            notify("Erro ao buscar jogos da Steam.", "error");
            setEditing(false);
            return;
        }
        if (data.isPrivate) {
            setIsPrivate(true);
            setAllGames([]);
        } else {
            setIsPrivate(false);
            setAllGames(data.games);
        }
        // pre-populate showcase with existing favoriteGames
        setShowcase(summary?.favoriteGames ?? []);
    }, [fetchGames, notify, summary]);

    /* ── showcase manipulation ── */
    const addToShowcase = (game: SteamGame) => {
        if (showcase.find((g) => g.appId === game.appId)) return;
        setShowcase((prev) => [...prev, game]);
    };

    const removeFromShowcase = (appId: number) => {
        setShowcase((prev) => prev.filter((g) => g.appId !== appId));
    };

    /* ── drag inside showcase ── */
    const onDragStart = (index: number) => setDragging(index);
    const onDragEnter = (index: number) => setDragOver(index);
    const onDragEnd = () => {
        if (dragging !== null && dragOver !== null && dragging !== dragOver) {
            setShowcase((prev) => reorder(prev, dragging, dragOver));
        }
        setDragging(null);
        setDragOver(null);
    };

    /* ── move up / down ── */
    const moveUp = (i: number) => {
        if (i === 0) return;
        setShowcase((prev) => reorder(prev, i, i - 1));
    };
    const moveDown = (i: number) => {
        if (i === showcase.length - 1) return;
        setShowcase((prev) => reorder(prev, i, i + 1));
    };

    /* ── save ── */
    const handleSave = async () => {
        setSaving(true);
        const ok = await saveShowcase(showcase);
        setSaving(false);
        if (ok) {
            notify("Showcase salvo com sucesso!", "success");
            setEditing(false);
        } else {
            notify("Erro ao salvar showcase.", "error");
        }
    };

    /* ─────────── render guards ─────────── */
    if (loading) {
        return (
            <div className="flex items-center gap-3 py-4 text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando perfil Steam...
            </div>
        );
    }

    if (!hasSteamConnection) {
        if (!isOwner) {
            return (
                <div className="w-full border-2 border-dashed border-[#4c6b8a]/20 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
                    <ImSteam className="w-6 h-6 text-[#4c6b8a]/40" color='#0A66C2' />
                    <p className="text-sm text-gray-500 font-medium text-center">
                        Este usuário ainda não vinculou uma conta da Steam.
                    </p>
                </div>
            );
        }
        return (
            <div className="w-full border border-dashed border-[#4c6b8a]/40 hover:border-[#66c0f4]/50 rounded-2xl p-5 flex flex-col gap-3 group transition-colors bg-white/[0.02]">
                <div className="flex items-center gap-2 text-[#4c6b8a] transition-colors group-hover:text-[#66c0f4]">
                    <ImSteam className="w-5 h-5" color='#0A66C2' />
                    <span className="font-bold text-white text-sm">Vincular Conta Steam</span>
                </div>
                <p className="text-xs text-gray-400">Insira a URL do seu perfil público da Steam para exibir seus jogos em destaque no seu perfil.</p>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <input
                        type="text"
                        placeholder="Ex: https://steamcommunity.com/id/seu-perfil"
                        value={steamUrlInput}
                        onChange={(e) => setSteamUrlInput(e.target.value)}
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#66c0f4] transition placeholder:text-white/20"
                    />
                    <button
                        onClick={async () => {
                            if (!steamUrlInput) {
                                notify("Insira a URL do perfil.", "error");
                                return;
                            }
                            setRegistering(true);
                            const ok = await registerSteam(steamUrlInput);
                            setRegistering(false);
                            if (ok) {
                                if (onProfileUpdated) {
                                    await onProfileUpdated();
                                }
                                notify("Conta Steam vinculada com sucesso!", "success");
                            } else {
                                notify("Erro ao vincular conta Steam. Verifique a URL.", "error");
                            }
                        }}
                        disabled={registering}
                        className="cursor-pointer bg-[#1b2838] hover:bg-[#2a3f5a] border border-[#4c6b8a] text-white text-sm font-bold rounded-xl px-5 py-2.5 transition disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
                    >
                        {registering ? (
                            <Loader2 className="w-4 h-4 text-[#66c0f4] animate-spin" />
                        ) : (
                            "Vincular"
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (error || !summary) {
        if (!isOwner) {
            return (
                <div className="w-full border-2 border-dashed border-[#4c6b8a]/20 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
                    <ImSteam className="w-6 h-6 text-[#4c6b8a]/40" color='#0A66C2' />
                    <p className="text-sm text-gray-500 font-medium text-center">
                        Perfil da Steam indisponível no momento.
                    </p>
                </div>
            );
        }
        return (
            <div className="w-full border-2 border-dashed border-red-500/20 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
                <ImSteam className="w-6 h-6 text-red-500/40" />
                <p className="text-sm text-red-400/80 font-medium text-center">
                    Erro ao carregar o perfil da Steam. Verifique sua conexão ou tente novamente mais tarde.
                </p>
            </div>
        );
    }

    const { steamProfile, favoriteGames } = summary;
    const hasFavorites = favoriteGames && favoriteGames.length > 0;

    /* ─────────── EDIT MODE ─────────── */
    if (editing) {
        return (
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImSteam className="w-5 h-5" color='#0A66C2' />
                        <span className="font-bold text-white text-sm">Editar Showcase Steam</span>
                    </div>
                    <button
                        onClick={() => setEditing(false)}
                        className="cursor-pointer text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {isPrivate && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-yellow-400 text-sm">
                        Sua biblioteca Steam está privada. Torne-a pública nas configurações de privacidade da Steam para poder escolher jogos.
                    </div>
                )}

                {loadingGames ? (
                    <div className="flex items-center gap-3 py-6 justify-center text-gray-400 text-sm">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Buscando seus jogos...
                    </div>
                ) : (
                    <>
                        {/* ── Showcase atual ── */}
                        <div>
                            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">
                                Showcase ({showcase.length} jogos) — arraste para reordenar
                            </p>
                            {showcase.length === 0 ? (
                                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center text-gray-500 text-sm">
                                    Adicione jogos abaixo para montar seu showcase
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {showcase.map((game, i) => (
                                        <div
                                            key={game.appId}
                                            draggable
                                            onDragStart={() => onDragStart(i)}
                                            onDragEnter={() => onDragEnter(i)}
                                            onDragEnd={onDragEnd}
                                            onDragOver={(e) => e.preventDefault()}
                                            className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 border transition-all ${dragOver === i && dragging !== i
                                                ? "border-ohara-blue/60 scale-[1.01]"
                                                : "border-white/10"
                                                } ${dragging === i ? "opacity-40" : ""}`}
                                        >
                                            <GripVertical className="w-4 h-4 text-gray-500 cursor-grab active:cursor-grabbing shrink-0" />
                                            <img
                                                src={game.iconUrl}
                                                alt={game.name}
                                                className="w-8 h-8 rounded-md object-cover shrink-0"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                            <span className="flex-1 text-sm text-white font-medium truncate">{game.name}</span>
                                            <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {game.playtimeHours}h
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => moveUp(i)}
                                                    disabled={i === 0}
                                                    className="cursor-pointer p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 transition"
                                                >
                                                    <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                                                </button>
                                                <button
                                                    onClick={() => moveDown(i)}
                                                    disabled={i === showcase.length - 1}
                                                    className="cursor-pointer p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 transition"
                                                >
                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                                </button>
                                                <button
                                                    onClick={() => removeFromShowcase(game.appId)}
                                                    className="cursor-pointer p-1 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition ml-1"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Lista de todos os jogos ── */}
                        {!isPrivate && allGames.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">
                                    Seus {allGames.length} jogos mais jogados
                                </p>
                                <div className="max-h-72 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {allGames.map((game) => {
                                        const inShowcase = showcase.some((g) => g.appId === game.appId);
                                        return (
                                            <div
                                                key={game.appId}
                                                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${inShowcase
                                                    ? "opacity-40 cursor-not-allowed"
                                                    : "hover:bg-white/5 cursor-pointer"
                                                    }`}
                                                onClick={() => !inShowcase && addToShowcase(game)}
                                            >
                                                <img
                                                    src={game.iconUrl}
                                                    alt={game.name}
                                                    className="w-7 h-7 rounded object-cover shrink-0"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                                <span className="flex-1 text-sm text-gray-300 truncate">{game.name}</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                                                    <Clock className="w-3 h-3" /> {game.playtimeHours}h
                                                </span>
                                                {!inShowcase && (
                                                    <span className="text-xs text-ohara-blue ml-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 hover:scale-102 active:scale-95 transition-all">+ Adicionar</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Actions ── */}
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => setEditing(false)}
                                className="cursor-pointer flex-1 py-3 rounded-2xl border border-white/10 text-gray-400 hover:bg-white/5 text-sm font-bold transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="cursor-pointer flex-1 py-3 rounded-2xl bg-[#1b2838] hover:bg-[#2a3f5a] border border-[#4c6b8a] text-white text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Salvar Showcase
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    /* ─────────── VIEW MODE ─────────── */
    return (
        <div className="space-y-4">
            {/* ── Steam profile header ── */}
            <div className="flex items-center justify-between">
                <a
                    href={steamProfile.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group"
                >
                    <div className="relative">
                        <img
                            src={steamProfile.avatar}
                            alt={steamProfile.personaname}
                            className="w-10 h-10 rounded-xl object-cover border border-[#4c6b8a]/50 group-hover:border-[#4c6b8a] transition"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#1b2838] rounded-full flex items-center justify-center border border-[#4c6b8a]/50">
                            <ImSteam className="w-2.5 h-2.5" color='#0A66C2' />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Steam</p>
                        <p className="text-sm font-semibold text-white group-hover:text-[#66c0f4] transition flex items-center gap-1">
                            {steamProfile.personaname}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                        </p>
                    </div>
                </a>

                {isOwner && (
                    <button
                        onClick={handleOpenEdit}
                        className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b2838] hover:bg-[#2a3f5a] border border-[#4c6b8a]/50 hover:border-[#4c6b8a] text-[#66c0f4] text-xs font-bold transition-all"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Editar Showcase
                    </button>
                )}
            </div>

            {/* ── No favorites + owner CTA ── */}
            {!hasFavorites && isOwner && (
                <button
                    onClick={handleOpenEdit}
                    className="cursor-pointer w-full border-2 border-dashed border-[#4c6b8a]/40 hover:border-[#4c6b8a] rounded-2xl p-5 flex flex-col items-center gap-2 transition-all group"
                >
                    <Gamepad2 className="w-6 h-6 text-[#4c6b8a] group-hover:text-[#66c0f4] transition" />
                    <p className="text-sm text-gray-500 group-hover:text-[#66c0f4] transition font-medium">
                        Adicionar jogos favoritos ao perfil
                    </p>
                    <p className="text-xs text-gray-600">Clique para montar seu showcase</p>
                </button>
            )}

            {/* ── No favorites + visitor ── */}
            {!hasFavorites && !isOwner && (
                <p className="text-xs text-gray-600 italic">Nenhum jogo em destaque ainda.</p>
            )}

            {/* ── Favorite games showcase ── */}
            {hasFavorites && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500/70" />
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Jogos em destaque</p>
                    </div>

                    {/* Cards */}
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                        {favoriteGames.map((game, index) => (
                            <GameCard key={game.appId} game={game} rank={index + 1} />
                        ))}
                    </div>

                    {/* Expand to show more — only if owner wants to show all */}
                    {isOwner && (
                        <button
                            onClick={() => setExpanded((p) => !p)}
                            className="cursor-pointer text-xs text-gray-600 hover:text-gray-400 transition flex items-center gap-1"
                        >
                            {expanded ? (
                                <><ChevronUp className="w-3 h-3" /> Recolher</>
                            ) : (
                                <><ChevronDown className="w-3 h-3" /> Gerenciar showcase</>
                            )}
                        </button>
                    )}

                    {expanded && isOwner && (
                        <button
                            onClick={handleOpenEdit}
                            className="cursor-pointer w-full py-2 rounded-xl border border-[#4c6b8a]/40 hover:border-[#4c6b8a] text-[#66c0f4] text-xs font-bold transition flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Editar showcase
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Game Card ─── */
function GameCard({ game, rank }: { game: SteamGame; rank: number }) {
    return (
        <a
            href={`https://store.steampowered.com/app/${game.appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative shrink-0 w-32 snap-start rounded-2xl overflow-hidden border border-white/10 hover:border-[#4c6b8a] transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-black/40"
        >
            {/* Cover */}
            <img
                src={game.coverUrl}
                alt={game.name}
                className="w-full h-44 object-cover"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/128x176/1b2838/66c0f4?text=${encodeURIComponent(game.name)}`;
                }}
            />
            {/* Rank badge */}
            {rank <= 3 && (
                <div
                    className={`absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${rank === 1
                        ? "bg-yellow-500 border-yellow-400 text-black"
                        : rank === 2
                            ? "bg-gray-400 border-gray-300 text-black"
                            : "bg-amber-700 border-amber-600 text-white"
                        }`}
                >
                    {rank}
                </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                <p className="text-white text-[10px] font-bold leading-tight line-clamp-2">{game.name}</p>
                <p className="text-gray-300 text-[9px] mt-0.5 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" /> {game.playtimeHours}h
                </p>
            </div>
        </a>
    );
}

/* ─── Steam SVG icon ─── */
function SteamIcon({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" style={{ color: "#66c0f4" }}>
            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z" />
        </svg>
    );
}