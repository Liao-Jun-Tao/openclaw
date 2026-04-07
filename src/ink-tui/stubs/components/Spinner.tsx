import React, { useState, useEffect } from "react";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export default function Spinner({ label }: { label?: string }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      {FRAMES[frame]}
      {label ? ` ${label}` : ""}
    </>
  );
}
