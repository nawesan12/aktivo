"use client";

import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface StaffCardProps {
  id: string;
  name: string;
  image: string | null;
  specialty: string | null;
  bio: string | null;
  isAny?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function StaffCard({ name, image, specialty, bio, isAny, selected, onClick }: StaffCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "glass rounded-xl p-5 text-left w-full transition-all duration-300 cursor-pointer",
        "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5",
        selected && "ring-2 ring-primary scale-[1.02] shadow-lg shadow-primary/10 bg-primary/5"
      )}
    >
      <div className="flex items-center gap-4">
        {isAny ? (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
        ) : image ? (
          <img
            src={image}
            alt={name}
            className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center text-white font-heading font-bold shrink-0">
            {getInitials(name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-heading font-semibold text-sm">{name}</h4>
          {specialty && (
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-medium">
              {specialty}
            </span>
          )}
          {bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{bio}</p>
          )}
        </div>
      </div>
    </button>
  );
}
