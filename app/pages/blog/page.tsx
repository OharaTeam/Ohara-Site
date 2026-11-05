"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useAuth } from "../../_context/AuthContext";
import { api } from "../../_hooks/fetcher";

interface PostFeedItem {
    id: string;
    tittle: string;
    media: string[];
    capa: string | null;
    evento: { id: string; nomeEvento: string } | null;
    _count?: {
        comentarios: number;
    };
}

export default function BlogPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<PostFeedItem[]>([]);
    const [isDev, setIsDev] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkDevRole = async () => {
            if (user?.roles) {
                const rolesDev = user.roles;
                setIsDev(rolesDev.includes('Dev'));
            }
        };
        checkDevRole();
    }, [user]);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const response = await api.get('/postagens?page=1&limit=10');
                setPosts(response.data.data || []);
            } catch (error) {
                console.error("Erro ao carregar o feed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-t-ohara-pink border-ohara-dark rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-ohara-white" style={{ textShadow: "var(--text-glow)" }}>
                    Ultimas Atividades
                </h1>
                {isDev && (
                    <Link href="/pages/blog/create"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-ohara-pink to-ohara-orange text-white font-bold text-lg shadow-lg hover:scale-105 transition-all">
                        Criar Atualização
                    </Link>
                )}
            </div>

            {posts.length === 0 ? (
                <div className="text-center text-ohara-white py-12 opacity-70">
                    Nenhuma atualização encontrada.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <Link
                            key={post.id}
                            href={`/pages/blog/${post.id}`}
                            className="bg-ohara-dark border border-[var(--separator-color)] rounded-xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-300"
                        >
                            <div className="w-full h-48 bg-black relative">
                                {post.capa ? (
                                    <img
                                        src={post.capa}
                                        alt={post.tittle}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[var(--separator-color)] text-white opacity-50">
                                        Sem Imagem
                                    </div>
                                )}

                                {post.evento && (
                                    <div className="absolute top-3 right-3 bg-[var(--secondary-accent)] text-white text-xs px-2 py-1 rounded-md font-bold">
                                        {post.evento.nomeEvento}
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <h2 className="text-xl font-bold text-ohara-white mb-2 line-clamp-2">
                                    {post.tittle}
                                </h2>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-[var(--accent-color)] text-sm font-semibold flex items-center gap-2">
                                        Clique para ler mais →
                                    </div>
                                    {Boolean(post._count?.comentarios && post._count.comentarios > 0) && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                            <MessageSquare size={14} className="text-ohara-blue/80" />
                                            <span>{post._count?.comentarios}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}