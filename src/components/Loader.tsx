import React from "react";

interface LoaderProps {
    text?: string; // ✅ Mensaje opcional
}

const Loader = ({ text }: LoaderProps) => {
    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexDirection: "column", // ✅ Coloca el mensaje arriba del loader
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8f9fa", // Color de fondo mientras carga
            zIndex: 10000
        }}>
            {text && ( // ✅ Si hay mensaje, lo mostramos arriba del loader
                <p style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#007bff",
                    marginBottom: "15px"
                }}>
                    {text}
                </p>
            )}
            <div style={{
                border: "5px solid #f3f3f3",
                borderTop: "5px solid #007bff",
                borderRadius: "50%",
                width: "50px",
                height: "50px",
                animation: "spin 1s linear infinite"
            }} />
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    );
};

export default Loader;
