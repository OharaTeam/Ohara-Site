"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from './fetcher';

export interface SteamProfileData {
    steamId: string;
    personaname: string;
    avatar: string;
    profileUrl: string;
}

export interface SteamGame {
    appId: number;
    name: string;
    playtimeHours: number;
    coverUrl: string;
    iconUrl: string;
}

export interface SteamSummary {
    steamProfile: SteamProfileData;
    favoriteGames: SteamGame[] | null;
}

export interface SteamGamesResponse {
    isPrivate: boolean;
    totalGames: number;
    games: SteamGame[];
}

export function useSteamProfile(discordId: string) {
    const [summary, setSummary] = useState<SteamSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async () => {
        if (!discordId) {
            setSummary(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/users/${discordId}/steam/summary`);
            setSummary(response.data);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setSummary(null);
            } else {
                setError(err.message || "Erro ao buscar sumário da Steam");
            }
        } finally {
            setLoading(false);
        }
    }, [discordId]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const fetchGames = useCallback(async (): Promise<SteamGamesResponse | null> => {
        try {
            const response = await api.get(`/users/${discordId}/steam/games`);
            return response.data;
        } catch {
            return null;
        }
    }, [discordId]);

    const saveShowcase = useCallback(
        async (games: SteamGame[]): Promise<boolean> => {
            try {
                const payload = {
                    games: games.map((g) => ({
                        appId: g.appId,
                        name: g.name,
                        playtimeHours: g.playtimeHours,
                        coverUrl: g.coverUrl,
                        iconUrl: g.iconUrl,
                    })),
                };
                await api.patch(`/users/me/steam/showcase`, payload);
                await fetchSummary();
                return true;
            } catch {
                return false;
            }
        },
        [fetchSummary]
    );

    const registerSteam = useCallback(
        async (steamUrl: string): Promise<boolean> => {
            try {
                await api.put(`/users/me/steam/add`, { steamUrl });
                await fetchSummary();
                return true;
            } catch {
                return false;
            }
        },
        [fetchSummary]
    );

    return { summary, loading, error, fetchGames, saveShowcase, reload: fetchSummary, registerSteam };
}