import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { BarChart3, Clock, Music, Play, RefreshCw, Star, TrendingUp, Trophy, WifiOff, Zap } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- types */

type SpotifyTrack = {
  name: string;
  artist: string;
  album: string;
  albumArt?: string;
  spotifyUrl: string;
  popularity: number;
  playedAt?: string;
};

type SpotifyArtist = { name: string; genres: string[] };

type PokemonCard = {
  id: string;
  name: string;
  rarity?: string;
  set?: { name: string };
  images?: { small: string; large: string };
  tcgplayer?: { prices?: { holofoil?: { market: number }; normal?: { market: number } } };
  quantity?: number;
};

type PokemonStats = { totalCards: number; uniqueCards: number; totalValue: number };

/* ------------------------------------------------------------ fetching */

const API = "/api";

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API}${path}`, { signal });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toTrack = (t: any, playedAt?: string): SpotifyTrack => ({
  name: t?.name ?? "Unknown track",
  artist: t?.artists?.[0]?.name ?? "Unknown artist",
  album: t?.album?.name ?? "Unknown album",
  albumArt: t?.album?.images?.[0]?.url,
  spotifyUrl: t?.external_urls?.spotify ?? "#",
  popularity: t?.popularity ?? 0,
  playedAt,
});

function useHobbiesData() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => getJson<{ status: string }>("/health", AbortSignal.any([signal, AbortSignal.timeout(2500)])),
    retry: 0,
    staleTime: 60_000,
  });
  const online = health.isSuccess;

  const dashboard = useQuery({
    queryKey: ["spotify", "dashboard"],
    queryFn: ({ signal }) => getJson<any>("/spotify/dashboard", signal), // eslint-disable-line @typescript-eslint/no-explicit-any
    enabled: online,
    select: (d) => ({
      topTrack: d?.topTrack?.track && !d.topTrack.error ? toTrack(d.topTrack.track) : undefined,
    }),
  });
  const topTracks = useQuery({
    queryKey: ["spotify", "top-tracks"],
    queryFn: ({ signal }) => getJson<any>("/spotify/top-tracks?limit=10", signal), // eslint-disable-line @typescript-eslint/no-explicit-any
    enabled: online,
    select: (d): SpotifyTrack[] => (Array.isArray(d?.items) ? d.items.map((t: unknown) => toTrack(t)) : []),
  });
  const topArtists = useQuery({
    queryKey: ["spotify", "top-artists"],
    queryFn: ({ signal }) => getJson<any>("/spotify/top-artists?limit=10", signal), // eslint-disable-line @typescript-eslint/no-explicit-any
    enabled: online,
    select: (d): SpotifyArtist[] =>
      Array.isArray(d?.items) ? d.items.map((a: any) => ({ name: a.name, genres: a.genres ?? [] })) : [], // eslint-disable-line @typescript-eslint/no-explicit-any
  });
  const recent = useQuery({
    queryKey: ["spotify", "recent"],
    queryFn: ({ signal }) => getJson<any>("/spotify/recently-played?limit=20", signal), // eslint-disable-line @typescript-eslint/no-explicit-any
    enabled: online,
    staleTime: 2 * 60_000,
    select: (d): SpotifyTrack[] => (Array.isArray(d?.items) ? d.items.map((i: any) => toTrack(i.track, i.played_at)) : []), // eslint-disable-line @typescript-eslint/no-explicit-any
  });
  const featured = useQuery({
    queryKey: ["pokemon", "featured"],
    queryFn: ({ signal }) => getJson<{ cards?: PokemonCard[] }>("/pokemon/featured?limit=6", signal),
    enabled: online,
    staleTime: 60 * 60_000,
    select: (d) => (Array.isArray(d?.cards) ? d.cards : []),
  });
  const stats = useQuery({
    queryKey: ["pokemon", "stats"],
    queryFn: ({ signal }) => getJson<PokemonStats>("/pokemon/stats", signal),
    enabled: online,
    staleTime: 60 * 60_000,
  });

  const genres = (() => {
    const count: Record<string, number> = {};
    for (const a of topArtists.data ?? []) for (const g of a.genres) count[g] = (count[g] ?? 0) + 1;
    return Object.entries(count)
      .map(([genre, n]) => ({ genre, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 6);
  })();

  const avgPopularity = topTracks.data?.length
    ? topTracks.data.reduce((s, t) => s + t.popularity, 0) / topTracks.data.length
    : 0;

  return { health, online, dashboard, topTracks, topArtists, recent, featured, stats, genres, avgPopularity };
}

/* ------------------------------------------------------------------- ui */

const rarityColor = (rarity?: string) => {
  switch (rarity?.toLowerCase()) {
    case "common":
      return "bg-slate/70";
    case "uncommon":
      return "bg-sage";
    case "rare":
      return "bg-soft-blue text-slate";
    case "ultra rare":
      return "bg-purple-500";
    case "secret rare":
      return "bg-gold text-slate";
    case "rainbow rare":
      return "bg-linear-to-r from-red-500 to-purple-500";
    default:
      return "bg-taupe";
  }
};

const Skeleton = ({ className }: { className?: string }) => <div className={cn("animate-pulse rounded-lg bg-slate/10", className)} />;

export default function Hobbies() {
  const d = useHobbiesData();
  const [tab, setTab] = useState<"overview" | "stats">("overview");
  const checking = d.health.isPending;

  return (
    <section id="hobbies" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="absolute inset-0 -z-10 bg-mesh-section" />
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader badge="Personal interests" icon={<Zap />} title="Hobbies" subtitle="What's a man without a hobby? Live from Spotify and my card binder." />

        {!checking && !d.online && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-8 flex max-w-xl items-center justify-center gap-3 rounded-2xl glass px-4 py-3 text-sm text-muted-foreground"
          >
            <WifiOff className="h-4 w-4 shrink-0 text-taupe" />
            Live data is offline right now. Start the backend to see real numbers.
            <button onClick={() => d.health.refetch()} className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-sage hover:bg-sage/10">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Spotify */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, ease: "easeOut" }}>
            <GlassCard className="overflow-hidden">
              <div className="flex items-center justify-between bg-linear-to-r from-[#1db954] to-[#1ed760] px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <Music className="h-5 w-5" />
                  <h3 className="font-raleway text-lg font-extrabold">Spotify</h3>
                </div>
                <div className="flex gap-1 rounded-full bg-white/15 p-1">
                  {(["overview", "stats"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize transition", tab === t ? "bg-white text-[#178a40]" : "text-white/85 hover:bg-white/15")}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6 p-6">
                {tab === "overview" ? (
                  <>
                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Most played</h4>
                      {checking || (d.online && d.dashboard.isPending) ? (
                        <Skeleton className="h-24" />
                      ) : d.dashboard.data?.topTrack ? (
                        <TrackRow track={d.dashboard.data.topTrack} big />
                      ) : (
                        <Empty icon={<Music className="h-7 w-7" />} text="Spotify data not available" />
                      )}
                    </div>

                    {(d.recent.data?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" /> Recently played
                        </h4>
                        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                          {d.recent.data!.slice(0, 8).map((t, i) => (
                            <TrackRow key={i} track={t} right={t.playedAt ? new Date(t.playedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : undefined} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        <BarChart3 className="h-3.5 w-3.5" /> This month
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <Stat label="Top tracks" value={d.online ? d.topTracks.data?.length ?? 0 : "—"} />
                        <Stat label="Top artists" value={d.online ? d.topArtists.data?.length ?? 0 : "—"} />
                        <Stat label="Avg popularity" value={d.online ? `${d.avgPopularity.toFixed(0)}%` : "—"} />
                      </div>
                      {d.genres.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {d.genres.map((g) => (
                            <span key={g.genre} className="rounded-full bg-[#1db954]/15 px-2.5 py-1 text-xs font-medium text-[#137a3a]">
                              {g.genre} · {g.n}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {(d.topTracks.data?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Top tracks</h4>
                        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                          {d.topTracks.data!.slice(0, 8).map((t, i) => (
                            <TrackRow key={i} track={t} index={i + 1} right={`${t.popularity}%`} />
                          ))}
                        </div>
                      </div>
                    )}
                    {!checking && !(d.topTracks.data?.length) && <Empty icon={<BarChart3 className="h-7 w-7" />} text="No stats yet" />}
                  </>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Pokémon */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, ease: "easeOut" }}>
            <GlassCard className="overflow-hidden">
              <div className="flex items-center justify-between bg-linear-to-r from-sage to-primary px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5" />
                  <h3 className="font-raleway text-lg font-extrabold">Pokémon card collection</h3>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6 grid grid-cols-3 gap-3">
                  <Stat label="Total cards" value={d.online ? d.stats.data?.totalCards ?? 0 : "—"} loading={checking || (d.online && d.stats.isPending)} />
                  <Stat label="Unique" value={d.online ? d.stats.data?.uniqueCards ?? 0 : "—"} loading={checking || (d.online && d.stats.isPending)} />
                  <Stat label="Est. value" value={d.online ? `$${(d.stats.data?.totalValue ?? 0).toFixed(0)}` : "—"} loading={checking || (d.online && d.stats.isPending)} />
                </div>

                <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  <Star className="h-3.5 w-3.5" /> Featured cards
                </h4>
                {checking || (d.online && d.featured.isPending) ? (
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-3/4" />
                    ))}
                  </div>
                ) : (d.featured.data?.length ?? 0) > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {d.featured.data!.map((card, i) => (
                      <div key={card.id ?? i} className="group relative aspect-3/4 overflow-hidden rounded-lg bg-slate/5 shadow-card transition-transform duration-300 hover:scale-[1.04]">
                        <img
                          src={card.images?.small ?? "/placeholder.svg"}
                          alt={card.name ?? "Pokémon card"}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                        {card.rarity && (
                          <span className={cn("absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white", rarityColor(card.rarity))}>{card.rarity}</span>
                        )}
                        {card.quantity && card.quantity > 1 && (
                          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">×{card.quantity}</span>
                        )}
                        <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="text-white">
                            <p className="text-sm font-semibold">{card.name}</p>
                            <p className="text-xs opacity-90">{card.set?.name}</p>
                            {card.tcgplayer?.prices && (
                              <p className="mt-1 text-xs font-medium">${(card.tcgplayer.prices.holofoil?.market ?? card.tcgplayer.prices.normal?.market ?? 0).toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty icon={<Trophy className="h-7 w-7" />} text="No cards to show right now" />
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrackRow({ track, big, index, right }: { track: SpotifyTrack; big?: boolean; index?: number; right?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg transition hover:bg-white/50", big ? "bg-white/45 p-4" : "p-2")}>
      {index !== undefined && <span className="w-5 text-center text-xs text-taupe">#{index}</span>}
      {track.albumArt && <img src={track.albumArt} alt="" className={cn("rounded-md shadow-card", big ? "h-16 w-16" : "h-9 w-9")} loading="lazy" />}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-semibold text-slate", big ? "text-base" : "text-sm")}>{track.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {track.artist}
          {big && ` · ${track.album}`}
        </p>
        {big && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-[#1db954]" /> {track.popularity}% popularity
          </p>
        )}
      </div>
      {big ? (
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-[#1db954] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#169c47]"
        >
          <Play className="h-3 w-3" /> Play
        </a>
      ) : (
        right && <span className="text-xs text-taupe">{right}</span>
      )}
    </div>
  );
}

function Stat({ label, value, loading }: { label: string; value: string | number; loading?: boolean }) {
  return (
    <div className="rounded-xl bg-white/45 p-3 text-center">
      {loading ? <Skeleton className="mx-auto mb-1 h-6 w-12" /> : <div className="font-raleway text-xl font-extrabold text-slate">{value}</div>}
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-white/40 py-8 text-center text-sm text-muted-foreground">
      <span className="opacity-50">{icon}</span>
      {text}
    </div>
  );
}
