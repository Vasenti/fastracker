import React from "react";
import "leaflet/dist/leaflet.css";
import "../styles/globals.css"

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="es">
        <head>
            <title>Fastracker</title>
        </head>
        <body>{children}</body>
        </html>
    );
}

