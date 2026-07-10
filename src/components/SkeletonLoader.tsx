import React from "react";

interface SkeletonLoaderProps {
  type: "track-row" | "card-grid" | "dashboard" | "lyrics" | "artist-header";
  count?: number;
}

export function SkeletonLoader({ type, count = 1 }: SkeletonLoaderProps) {
  const renderTrackRow = (key?: any) => (
    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-[#181818]/40 border border-white/[0.02] animate-pulse mb-2">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-4 h-4 bg-white/10 rounded" />
        <div className="w-10 h-10 bg-white/10 rounded-md" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-white/15 rounded w-1/3" />
          <div className="h-3 bg-white/10 rounded w-1/4" />
        </div>
      </div>
      <div className="w-24 h-3.5 bg-white/10 rounded hidden md:block" />
      <div className="w-10 h-3.5 bg-white/10 rounded" />
    </div>
  );

  const renderCardGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-4 rounded-xl bg-[#121212] border border-white/[0.02] animate-pulse space-y-3">
          <div className="aspect-square bg-white/10 rounded-lg w-full" />
          <div className="space-y-2">
            <div className="h-3.5 bg-white/15 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6 p-6">
      {/* Welcome Message Skeleton */}
      <div className="h-9 bg-white/15 rounded-lg w-1/4 animate-pulse" />

      {/* Categories Bar Skeleton */}
      <div className="flex gap-2 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-16 h-8 bg-white/10 rounded-full" />
        ))}
      </div>

      {/* Recents Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/10 rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Track Section Skeletons */}
      <div className="space-y-3">
        <div className="h-6 bg-white/15 rounded w-1/5 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => renderTrackRow(i))}
      </div>
    </div>
  );

  const renderLyrics = () => (
    <div className="space-y-4 py-8 max-w-xl mx-auto animate-pulse">
      <div className="h-7 bg-white/20 rounded w-3/4" />
      <div className="h-7 bg-white/15 rounded w-2/3" />
      <div className="h-7 bg-white/15 rounded w-4/5" />
      <div className="h-7 bg-white/10 rounded w-1/2" />
      <div className="h-7 bg-white/15 rounded w-3/5" />
    </div>
  );

  const renderArtistHeader = () => (
    <div className="relative h-[240px] md:h-[300px] w-full bg-[#181818] animate-pulse flex items-end p-8">
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      <div className="relative z-10 flex items-center gap-6">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded w-24" />
          <div className="h-10 bg-white/15 rounded w-48" />
          <div className="h-4 bg-white/10 rounded w-32" />
        </div>
      </div>
    </div>
  );

  switch (type) {
    case "track-row":
      return <div className="space-y-1">{Array.from({ length: count }).map((_, i) => renderTrackRow(i))}</div>;
    case "card-grid":
      return renderCardGrid();
    case "dashboard":
      return renderDashboard();
    case "lyrics":
      return renderLyrics();
    case "artist-header":
      return renderArtistHeader();
    default:
      return null;
  }
}

export default SkeletonLoader;
