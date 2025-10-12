"use client";
import { useState, useEffect } from "react";
import DrawingCanvas from "./DrawingCanvas";

export default function ClientOnlyDrawingCanvas({ mode, ...props }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`relative ${props.className || ""}`}>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Chargement du canvas...
          </p>
        </div>
      </div>
    );
  }

  return <DrawingCanvas mode={mode} {...props} />;
}
