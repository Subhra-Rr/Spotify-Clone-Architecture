import React from "react";

interface ClickableArtistsProps {
  artist: string;
  onArtistClick: (artistName: string) => void;
  className?: string;
  artistClassName?: string;
}

export const ClickableArtists: React.FC<ClickableArtistsProps> = ({
  artist,
  onArtistClick,
  className = "text-sm text-[#b3b3b3] truncate max-w-full font-medium block",
  artistClassName = "hover:text-white hover:underline cursor-pointer transition-colors"
}) => {
  if (!artist) return null;

  // Split by common delimiters while keeping the delimiters as separate items in the array
  const delimitersRegex = /(\s+feat\b\.?|\s+featuring\b|\s+ft\b\.?|\s*,\s*|\s+&\s+|\s+and\s+)/gi;
  const parts = artist.split(delimitersRegex);

  // If there's only one part, render it directly
  if (parts.length <= 1) {
    return (
      <span
        onClick={(e) => {
          e.stopPropagation();
          onArtistClick(artist.trim());
        }}
        className={`${artistClassName} truncate`}
        title={artist}
      >
        {artist}
      </span>
    );
  }

  return (
    <span className={className} title={artist}>
      {parts.map((part, index) => {
        // Even indices are the artist names, odd indices are the delimiters
        if (index % 2 === 0) {
          const trimmedPart = part.trim();
          if (!trimmedPart) return null;
          return (
            <span
              key={`${part}-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                onArtistClick(trimmedPart);
              }}
              className={artistClassName}
            >
              {part}
            </span>
          );
        } else {
          return (
            <span key={`${part}-${index}`} className="text-inherit select-none">
              {part}
            </span>
          );
        }
      })}
    </span>
  );
};
