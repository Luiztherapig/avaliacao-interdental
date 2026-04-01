"use client";

import { Laugh, Meh, Smile, Frown, Angry } from "lucide-react";
import { cn } from "@/lib/utils";

const faces = [
  {
    value: 1,
    label: "Muito ruim",
    icon: Angry,
    bg: "bg-red-500",
    hover: "hover:bg-red-600"
  },
  {
    value: 2,
    label: "Ruim",
    icon: Frown,
    bg: "bg-orange-500",
    hover: "hover:bg-orange-600"
  },
  {
    value: 3,
    label: "Regular",
    icon: Meh,
    bg: "bg-yellow-400",
    hover: "hover:bg-yellow-500"
  },
  {
    value: 4,
    label: "Bom",
    icon: Smile,
    bg: "bg-lime-500",
    hover: "hover:bg-lime-600"
  },
  {
    value: 5,
    label: "Excelente",
    icon: Laugh,
    bg: "bg-green-500",
    hover: "hover:bg-green-600"
  }
];

export function EmojiRating({
  value,
  onChange
}: {
  value?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {faces.map((face) => {
        const Icon = face.icon;
        const selected = value === face.value;

        return (
          <button
            type="button"
            key={face.value}
            onClick={() => onChange(face.value)}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl px-2 py-3 transition-all",
              face.bg,
              face.hover,
              selected
                ? "scale-105 shadow-lg"
                : "opacity-80 hover:opacity-100"
            )}
          >
            <Icon className="h-5 w-5 text-white" />
            <span className="mt-2 text-[11px] font-medium text-white">
              {face.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}