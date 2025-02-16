// src/app/layout.tsx
import React from "react";

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="es">
        <head>
            <title>Calculador de Ruta Óptima</title>
        </head>
        <body>{children}</body>
        </html>
    );
}

