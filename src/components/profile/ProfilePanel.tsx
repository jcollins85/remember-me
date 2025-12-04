import React, { useState } from "react";
import {
  X,
  UserRound,
  Award,
  MapPin,
  Tag as TagIcon,
  Star,
  ChevronDown,
  Check,
  TrendingUp,
  Heart,
  Clock,
} from "lucide-react";
import type { AchievementProgress, AchievementStats } from "../../hooks/useAchievements";

interface UsageInsights {
  topVenue?: { name: string; count: number };
  topTag?: { name: string; count: number };
  favoritesCount: number;
  lastInteraction?: { name: string; date: string };
}

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
  achievements: AchievementProgress[];
  stats: AchievementStats;
  insights: UsageInsights;
}

const typeIconMap = {
  people: <UserRound size={16} />,
  venues: <MapPin size={16} />,
  tags: <TagIcon size={16} />,
  favorites: <Star size={16} />,
};

const sectionMeta = {
  people: { label: "People", icon: <UserRound size={14} /> },
  venues: { label: "Venues", icon: <MapPin size={14} /> },
  tags: { label: "Tags", icon: <TagIcon size={14} /> },
  favorites: { label: "Favourites", icon: <Star size={14} /> },
} as const;

export default function ProfilePanel({
  open,
  onClose,
  achievements,
  stats,
  insights,
}: ProfilePanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    people: false,
    venues: false,
    tags: false,
    favorites: false,
  });

  const grouped = achievements.reduce<Record<string, typeof achievements>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  const toggleSection = (type: keyof typeof sectionMeta) => {
    setOpenSections((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 h-9 w-9 rounded-full border border-white/70 text-[var(--color-text-secondary)] hover:bg-white flex items-center justify-center"
          onClick={onClose}
          aria-label="Close profile"
        >
          <X size={16} />
        </button>

        <div
          className="overflow-y-auto px-6 pb-6 pt-6 space-y-6"
          style={{ scrollbarGutter: "stable" }}
        >

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[var(--color-accent-muted)] flex items-center justify-center text-[var(--color-accent)] text-2xl shadow-level1">
              <UserRound size={28} />
            </div>
            <div>
              <p className="text-sm uppercase text-[var(--color-text-secondary)] tracking-wide">
                Your Profile
              </p>
              <h2 className="text-2xl font-semibold">Remember Me</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {stats.peopleCount} people · {stats.venuesWithPeople} venues · {stats.uniqueTagCount} tags used
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            {[
              { label: "People tracked", value: stats.peopleCount },
              { label: "Venues logged", value: stats.venuesWithPeople },
              { label: "Favourite venues", value: stats.favoriteVenueCount },
              { label: "Tags applied", value: stats.uniqueTagCount },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] px-3 py-4"
              >
                <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  {item.value}
                </p>
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[var(--color-accent)]" />
              <div>
                <p className="text-sm font-semibold">Usage Insights</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Quick highlights from your recent activity.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {insights.topVenue ? (
                <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] px-3 py-3 text-left">
                  <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Top venue</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{insights.topVenue.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {insights.topVenue.count} people logged
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] px-3 py-3 text-left text-xs text-[var(--color-text-secondary)]">
                  No venue data yet.
                </div>
              )}
              {insights.topTag ? (
                <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] px-3 py-3 text-left">
                  <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Top tag</p>
                  <p className="font-semibold text-[var(--color-text-primary)] capitalize">
                    {insights.topTag.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{insights.topTag.count} mentions</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] px-3 py-3 text-left text-xs text-[var(--color-text-secondary)]">
                  No tag usage yet.
                </div>
              )}
              <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] px-3 py-3 text-left flex items-center gap-3">
                <Heart size={18} className="text-[var(--color-accent)]" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Favourite people</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{insights.favoritesCount}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] px-3 py-3 text-left flex items-center gap-3">
                <Clock size={18} className="text-[var(--color-accent)]" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Last interaction</p>
                  {insights.lastInteraction ? (
                    <>
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {insights.lastInteraction.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {new Date(insights.lastInteraction.date).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-[var(--color-text-secondary)]">No recent meetings yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <Award size={18} className="text-[var(--color-accent)]" />
              <div>
                <p className="text-sm font-semibold">Achievements</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Unlock milestones as you connect with more people.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {(Object.keys(sectionMeta) as Array<keyof typeof sectionMeta>).map((type) => {
                const list = grouped[type] ?? [];
                if (list.length === 0) return null;
                const isOpen = openSections[type];
                const meta = sectionMeta[type];
                const nextTarget = list.find((item) => !item.unlocked);

                return (
                  <div key={type} className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)]">
                    <button
                      onClick={() => toggleSection(type)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                          {meta.icon}
                          <span>{meta.label}</span>
                        </div>
                        {nextTarget ? (
                          <p className="text-[11px] text-[var(--color-text-secondary)]">
                            Next: {nextTarget.title} · {nextTarget.current}/{nextTarget.target}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[var(--color-text-secondary)]">All achievements unlocked</p>
                        )}
                      </div>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                        isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-3 pb-3 space-y-2">
                        {list.map((achievement) => (
                          <div
                            key={achievement.id}
                            className={`rounded-xl px-3 py-2 transition relative border ${
                              achievement.unlocked
                                ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)]/70"
                                : "border-white/60 bg-white/85"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`h-9 w-9 rounded-2xl flex items-center justify-center ${
                                  achievement.unlocked
                                    ? "bg-[#F59E0B] text-white"
                                    : "bg-white text-[var(--color-text-primary)] border border-white/60"
                                }`}
                              >
                                {typeIconMap[achievement.type]}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                                    {achievement.title}
                                  </p>
                        {!achievement.unlocked && (
                          <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                            {achievement.current}/{achievement.target}
                          </span>
                        )}
                                </div>
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                  {achievement.description}
                                </p>
                                {achievement.unlocked && achievement.unlockedAt && (
                                  <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)] mt-1">
                                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                                  </p>
                                )}
                                <div className="mt-2">
                                  <div className="h-1.5 rounded-full overflow-hidden bg-white/60">
                                    <div
                                      className={`h-full ${
                                        achievement.unlocked
                                          ? "bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"
                                          : "bg-[var(--color-accent-muted)]"
                                      }`}
                                      style={{
                                        width: `${Math.round(achievement.progress * 100)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            {achievement.unlocked && (
                              <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] text-white flex items-center justify-center shadow">
                                <Check size={12} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
