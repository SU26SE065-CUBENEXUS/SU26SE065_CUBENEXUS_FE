import React from "react";

export const initialCubeColors = {
  U: ["W", "W", "W", "W", "W", "W", "W", "W", "W"], // U: White
  L: ["O", "O", "O", "O", "O", "O", "O", "O", "O"], // L: Orange
  F: ["G", "G", "G", "G", "G", "G", "G", "G", "G"], // F: Green
  R: ["R", "R", "R", "R", "R", "R", "R", "R", "R"], // R: Red
  B: ["B", "B", "B", "B", "B", "B", "B", "B", "B"], // B: Blue
  D: ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"], // D: Yellow
};

// WCA Scrambler Generator
export const generateWcaScramble = (length = 25) => {
  const faces = ["R", "L", "U", "D", "F", "B"];
  const modifiers = ["", "'", "2"];
  const scramble = [];
  let lastFace = "";
  let secondLastFace = "";

  while (scramble.length < length) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    if (face === lastFace) continue;

    // Check if face is opposite to lastFace and same as secondLastFace (e.g. R L R)
    const isOpposite = (f1: string, f2: string) => {
      return (
        (f1 === "R" && f2 === "L") ||
        (f1 === "L" && f2 === "R") ||
        (f1 === "U" && f2 === "D") ||
        (f1 === "D" && f2 === "U") ||
        (f1 === "F" && f2 === "B") ||
        (f1 === "B" && f2 === "F")
      );
    };

    if (isOpposite(face, lastFace) && face === secondLastFace) continue;

    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    scramble.push(face + modifier);
    secondLastFace = lastFace;
    lastFace = face;
  }
  return scramble.join(" ");
};

// Helper to retrieve color style for Rubik net stickers
export const getStickerColorClass = (code: string) => {
  switch (code) {
    case "W":
      return "bg-[#f4f4f5] border border-zinc-300/40";
    case "O":
      return "bg-[#ff5800]"; // Official Rubik Orange
    case "G":
      return "bg-[#009b48]"; // Official Rubik Green
    case "R":
      return "bg-[#b71234]"; // Official Rubik Red
    case "B":
      return "bg-[#0046ad]"; // Official Rubik Blue
    case "Y":
      return "bg-[#ffd500]"; // Official Rubik Yellow
    default:
      return "bg-zinc-700";
  }
};

// Render 3x3 Rubik Face helper
export const renderRubikFace = (stickers: string[], size: "sm" | "lg" = "sm") => {
  const isLg = size === "lg";
  return (
    <div
      className={`grid grid-cols-3 flex-shrink-0 bg-zinc-950 border rounded-xl shadow-lg transition-all duration-300 ${isLg
        ? "gap-[3px] p-[5px] border-zinc-800/80 w-[94px] h-[94px]"
        : "gap-[2px] p-[3px] border-zinc-800 w-[46px] h-[46px] rounded-lg"
        }`}
    >
      {stickers.map((st, i) => (
        <div
          key={i}
          className={`rounded-[2px] transition-all duration-300 hover:scale-105 ${isLg ? "w-[26px] h-[26px]" : "w-3 h-3"
            } ${getStickerColorClass(st)}`}
        />
      ))}
    </div>
  );
};

// Helper to format time (e.g. 11.024s)
export const formatTime = (ms: number) => {
  const totalSeconds = ms / 1000;
  return totalSeconds.toFixed(3) + "s";
};

// Speedcubing average calculations
export const calculateAo5 = (times: number[]) => {
  if (times.length < 5) return null;
  const last5 = times.slice(0, 5);
  const sorted = [...last5].sort((a, b) => a - b);
  const middle3 = sorted.slice(1, 4); // Remove best and worst
  return middle3.reduce((a, b) => a + b, 0) / 3;
};

export const calculateAo12 = (times: number[]) => {
  if (times.length < 12) return null;
  const last12 = times.slice(0, 12);
  const sorted = [...last12].sort((a, b) => a - b);
  const middle10 = sorted.slice(1, 11); // Remove best and worst
  return middle10.reduce((a, b) => a + b, 0) / 10;
};
