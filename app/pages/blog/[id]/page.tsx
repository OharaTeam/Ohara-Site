
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    BookOpen,
    Sparkles,
    Tag,
} from "lucide-react";
import { api } from "../../../_hooks/fetcher";
import { useComments } from "../../../_hooks/useComments";
import { CommentList } from "../../../components/comments/CommentList";

interface Post {
    id: string;
    tittle: string;
    content: string;
    media: string[];
    author: {
        id?: string;
        discordId?: string;
        globalName: string | null;
        avatarUrl: string;
        roles: { name: string }[];
    };
    createdAt: string;
    updatedAt: string;
    evento: {
        nomeEvento: string;
    } | null;
    _count?: {
        comentarios: number;
    };
}

export default function LerPostPage() {
    const params = useParams();
    const router = useRouter();

    const postId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
    const {
        comments,
        totalCount,
        loading: commentsLoading,
        loadingMore,
        hasMore,
        loadMore,
    } = useComments(postId);

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await api.get(`/postagens/${params.id}`);
                setPost(response.data);
            } catch (error) {
                console.error("Erro ao carregar o post:", error);
                router.push("/pages/blog");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchPost();
        }
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-ohara-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-ohara-pink/20 border-t-ohara-pink border-r-ohara-blue rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">
                        Carregando publicação...
                    </p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-ohara-dark flex items-center justify-center text-ohara-white">
                Post não encontrado.
            </div>
        );
    }

    const capaUrl =
        post.media && post.media.length > 0 ? post.media[0] : null;

    const dataPublicacao = new Date(post.createdAt).toLocaleDateString(
        "pt-BR",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    );

    const horaPublicacao = new Date(post.createdAt).toLocaleTimeString(
        "pt-BR",
        {
            hour: "2-digit",
            minute: "2-digit",
        }
    );

    console.log(post.author.roles.map(role => role.name))

    return (
        <div className="min-h-screen bg-ohara-dark pb-20 relative overflow-hidden">

            {/* --- DECORAÇÃO DE FUNDO --- */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-ohara-pink/10 rounded-full blur-[130px]" />
                <div className="absolute top-[500px] -left-40 w-96 h-96 bg-ohara-blue/10 rounded-full blur-[130px]" />

                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                    }}
                />
            </div>

            <main className="relative max-w-5xl mx-auto px-4 pt-8 md:pt-10 flex flex-col gap-6">

                {/* --- TOPO --- */}
                <div className="flex items-center justify-between gap-4">
                    <Link
                        href="/pages/blog"
                        className="group inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-ohara-white transition-colors"
                    >
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 group-hover:border-ohara-pink/40 group-hover:bg-ohara-pink/10 transition-all">
                            <ArrowLeft size={18} />
                        </span>
                        <span className="hidden sm:inline">
                            Voltar para o Feed
                        </span>
                    </Link>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <BookOpen size={15} />
                        <span>Leitura da comunidade</span>
                    </div>
                </div>

                {/* --- CARD PRINCIPAL --- */}
                <article className="relative bg-white/[0.035] border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">

                    {/* Linha neon no topo */}
                    <div
                        className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, var(--color-ohara-pink), var(--color-ohara-blue), transparent)",
                        }}
                    />

                    {/* --- CAPA --- */}
                    {capaUrl ? (
                        <div className="relative w-full h-64 sm:h-80 md:h-[420px] overflow-hidden">

                            <img
                                src={capaUrl}
                                alt={post.tittle}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="relative h-32 bg-gradient-to-br from-ohara-pink/10 via-transparent to-ohara-blue/10">
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                <Sparkles size={70} />
                            </div>
                        </div>
                    )}

                    {/* --- INFORMAÇÕES DO POST --- */}
                    <div className="px-5 py-7 sm:px-8 md:px-12 md:py-10">

                        {/* Etiqueta do evento */}
                        {post.evento && (
                            <div className="mb-5">
                                <span className="inline-flex items-center gap-2 bg-ohara-pink/10 border border-ohara-pink/30 text-ohara-pink px-3 py-1.5 rounded-full text-xs font-bold">
                                    <Tag size={13} />
                                    Evento: {post.evento.nomeEvento}
                                </span>
                            </div>
                        )}

                        {/* Título */}
                        <h1
                            className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.12] tracking-tight text-ohara-white mb-6"
                            style={{
                                textShadow: "var(--text-glow)",
                            }}
                        >
                            {post.tittle}
                        </h1>

                        {/* Divisor */}
                        <div className="flex items-center gap-3 mb-7">
                            <div className="h-[2px] w-12 bg-ohara-pink rounded-full" />
                            <div className="h-[2px] w-4 bg-ohara-blue rounded-full" />
                            <div className="h-[2px] flex-1 bg-white/5" />
                        </div>

                        {/* --- AUTOR --- */}
                        <div className="flex flex-wrap items-center justify-between gap-5 mb-10">

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-ohara-pink to-ohara-blue opacity-50 blur-sm" />

                                    <img
                                        src={
                                            post.author.avatarUrl ||
                                            "https://cdn.discordapp.com/embed/avatars/0.png"
                                        }
                                        alt="Avatar do autor"
                                        className="relative w-12 h-12 rounded-full border-2 border-ohara-dark object-cover"
                                    />
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <span className="text-ohara-white font-bold text-sm">
                                        {post.author.globalName ||
                                            "Autor Desconhecido"}
                                    </span>

                                    <span className="text-gray-500 text-xs">
                                        {post.author.roles.some(({ name }) => name === "Dev") ? (
                                            <span className="text-red-600 font-bold">Desenvolvedor</span>
                                        ) : post.author.roles.some(({ name }) => name === "Arqueólogo") ? (
                                            <span className="text-ohara-blue font-bold">Arqueólogo</span>
                                        ) : (
                                            <span className="text-gray-500 font-bold">Membro</span>
                                        )}
                                    </span>

                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-xs">
                                <div className="flex items-center gap-2">
                                    <CalendarDays
                                        size={15}
                                        className="text-ohara-pink"
                                    />
                                    <span>{dataPublicacao}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock3
                                        size={15}
                                        className="text-ohara-blue"
                                    />
                                    <span>{horaPublicacao}</span>
                                </div>
                            </div>
                        </div>

                        {/* --- CONTEÚDO --- */}
                        <div className="relative">

                            <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-ohara-pink via-ohara-blue/30 to-transparent hidden md:block" />

                            <div className="prose prose-invert prose-lg max-w-none
                                prose-headings:text-ohara-white
                                prose-headings:font-black
                                prose-headings:tracking-tight
                                prose-p:text-gray-300
                                prose-p:leading-8
                                prose-strong:text-ohara-white
                                prose-a:text-ohara-blue
                                hover:prose-a:text-ohara-pink
                                prose-a:transition-colors
                                prose-blockquote:border-ohara-pink
                                prose-blockquote:bg-white/[0.03]
                                prose-blockquote:rounded-r-xl
                                prose-code:text-ohara-pink
                                prose-code:bg-white/5
                                prose-code:px-1.5
                                prose-code:py-0.5
                                prose-code:rounded
                                prose-img:rounded-2xl
                                prose-img:shadow-xl
                                prose-li:text-gray-300
                                prose-hr:border-white/10
                            ">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                    {post.content}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* --- RODAPÉ DO POST --- */}
                        <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                <Sparkles
                                    size={14}
                                    className="text-ohara-pink"
                                />
                                <span className="text-gray-300 font-bold ">Obrigado por fazer parte da Ohara.</span>
                            </div>

                            <Link
                                href="/pages/blog"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-ohara-blue hover:text-ohara-pink transition-colors"
                            >
                                Ver mais posts
                                <ArrowLeft
                                    size={15}
                                    className="rotate-180"
                                />
                            </Link>
                        </div>

                        {/* --- SEÇÃO DE COMENTÁRIOS --- */}
                        <section id="comentarios" className="mt-12 pt-8 border-t border-white/10">
                            <CommentList
                                comments={comments}
                                totalCount={totalCount || post._count?.comentarios || 0}
                                loading={commentsLoading}
                                loadingMore={loadingMore}
                                hasMore={hasMore}
                                loadMore={loadMore}
                                postAuthorId={post.author.id || post.author.discordId}
                            />
                        </section>

                    </div>
                </article>
            </main>
        </div>
    );
}