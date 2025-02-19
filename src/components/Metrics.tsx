import React from "react";

interface MetricsProps {
    duration: number;
    distance: number;
}

const Metrics = (
    { duration, distance }: MetricsProps
) => {
    const formatDuration = (seconds: number) => {
        if (seconds < 60) {
            return `${seconds.toFixed(0)} seg`;
        } else if (seconds < 3600) {
            return `${(seconds / 60).toFixed(2)} min`;
        } else if (seconds < 86400) {
            return `${(seconds / 3600).toFixed(2)} h`;
        } else if (seconds < 2592000) { // 30 días aprox.
            return `${(seconds / 86400).toFixed(2)} días`;
        } else if (seconds < 31536000) { // 12 meses aprox.
            return `${(seconds / 2592000).toFixed(2)} meses`;
        } else {
            return `${(seconds / 31536000).toFixed(2)} años`;
        }
    };

    return (
        <div style={{
            position: "absolute",
            top: 20,
            right: "50%",
            zIndex: 1002,
            background: "rgba(255,255,255,0.9)",
            padding: "10px",
            borderRadius: "5px",
            color: "black"
        }}>
            <p><strong>Distancia Total:</strong> {distance ? `${distance.toFixed(2)} km` : "Calculando..."}
            </p>
            <p><strong>Tiempo Estimado:</strong> {duration ? formatDuration(duration) : "Calculando..."}
            </p>
        </div>
    )
}

export default Metrics;