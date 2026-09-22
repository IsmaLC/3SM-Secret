import React, { useState, useRef } from "react";

interface FuseButtonProps {
  label: string;
  activeLabel?: string;
  icon?: React.ReactNode;
  duration?: number; // Duración de la mecha en ms (por defecto 2000)
  disabled?: boolean;
  onTrigger: () => Promise<string | void>;
  onComplete: (result?: string) => void;
  className?: string;
}

export const FuseButton: React.FC<FuseButtonProps> = ({
  label,
  activeLabel = "Generando",
  icon,
  duration = 3200,
  disabled = false,
  onTrigger,
  onComplete,
  className = "",
}) => {
  const [isBurning, setIsBurning] = useState(false);
  const isTriggered = useRef(false);

  const handleClick = async () => {
    if (disabled || isBurning || isTriggered.current) return;
    isTriggered.current = true;
    setIsBurning(true);

    try {
      // Ejecutar la tarea en paralelo con la mecha animada de duración estricta
      const triggerPromise = onTrigger();
      const fusePromise = new Promise((resolve) => setTimeout(resolve, duration));

      const [result] = await Promise.all([triggerPromise, fusePromise]);

      // Al completar exactamente el recorrido de la mecha, pasar a la siguiente ventana
      onComplete(result || undefined);
    } catch (err) {
      console.error("Error en FuseButton:", err);
      setIsBurning(false);
      isTriggered.current = false;
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`relative select-none inline-flex items-center justify-center font-semibold text-xs rounded-xl overflow-hidden transition-all duration-150 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${isBurning ? "pointer-events-none" : "hover:brightness-95 active:scale-[0.98]"} ${className}`}
      style={{
        minWidth: "140px",
        minHeight: "38px",
      }}
    >
      {/* Línea roja 100% limpia sin difuminado, recorriendo el borde perimetral del botón */}
      {isBurning && (
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full z-20"
          style={{ overflow: "visible" }}
          aria-hidden="true"
        >
          <rect
            pathLength="100"
            className="fill-none"
            style={{
              x: "1.25px",
              y: "1.25px",
              width: "calc(100% - 2.5px)",
              height: "calc(100% - 2.5px)",
              rx: "11px",
              stroke: "#ef4444",
              strokeWidth: "2.5px",
              strokeLinecap: "round",
              strokeDasharray: "100",
              strokeDashoffset: "100",
              animation: `fuseCleanRedCircuit ${duration}ms linear forwards`,
            }}
          />
        </svg>
      )}

      {/* Contenido de texto: 100% nítido, sin punto rojo ni difuminados */}
      <div className="relative flex items-center justify-center gap-2 z-10 w-full py-2 px-4 text-white">
        {isBurning ? (
          <span className="tracking-wide text-white font-semibold text-xs select-none">
            {activeLabel}...
          </span>
        ) : (
          <div className="flex items-center gap-2">
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{label}</span>
          </div>
        )}
      </div>

      {/* Animación continua y nítida de la línea roja perimetral */}
      <style>{`
        @keyframes fuseCleanRedCircuit {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </button>
  );
};
