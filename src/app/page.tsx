// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import AddressInput from '@/components/AddressInput';
import AddressList from '@/components/AddressList';
import ExcelUpload from '@/components/ExcelUpload';
import { calculateOptimalRoute } from '@/lib/calculateOptimalRoute'; // Para ingreso manual
import { ExcelRow } from '@/lib/calculateOptimalRoute';
import * as XLSX from 'xlsx';

export default function HomePage() {
    // Ingreso manual (array de strings)
    const [addresses, setAddresses] = useState<string[]>([]);
    const [optimizedRoute, setOptimizedRoute] = useState<string[] | null>(null);

    // Resultados para Excel (array de ExcelRow)
    const [excelRoute, setExcelRoute] = useState<ExcelRow[] | null>(null);

    const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving');
    const [loading, setLoading] = useState<boolean>(false);

    const addAddress = (address: string) => {
        setAddresses((prev) => [...prev, address]);
        setOptimizedRoute(null);
    };

    const handleCalculateRoute = async () => {
        if (addresses.length < 2) return;
        setLoading(true);
        const result = await calculateOptimalRoute(addresses, travelMode);
        setOptimizedRoute(result);
        setLoading(false);
    };

    // Función para descargar el Excel ordenado
    const handleDownloadExcel = () => {
        if (!excelRoute) return;
        // Extraemos los datos completos originales de cada fila
        const exportData = excelRoute.map((row) => row.data);
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ordenado');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'excel_ordenado.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Optimización de Rutas</h1>

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="travelMode">Modo de Viaje: </label>
                <select
                    id="travelMode"
                    value={travelMode}
                    onChange={(e) => setTravelMode(e.target.value as 'driving' | 'walking')}
                >
                    <option value="driving">Conduciendo</option>
                    <option value="walking">Caminando</option>
                </select>
            </div>

            {/* Sección de ingreso manual */}
            <h2>Ingreso Manual</h2>
            <AddressInput onAddAddress={addAddress} />
            <AddressList addresses={addresses} title="Direcciones Agregadas (Manual)" />
            <button onClick={handleCalculateRoute} disabled={addresses.length < 2 || loading}>
                {loading ? 'Calculando...' : 'Calcular Ruta Óptima'}
            </button>
            {optimizedRoute && (
                <div style={{ marginTop: '2rem' }}>
                    <h2>Ruta Óptima Manual ({travelMode === 'driving' ? 'Carretera' : 'Caminando'})</h2>
                    <AddressList addresses={optimizedRoute} title="Ruta Optimizada" />
                </div>
            )}

            <hr />

            {/* Sección de carga desde Excel */}
            <h2>Carga desde Excel</h2>
            <ExcelUpload travelMode={travelMode} onResult={setExcelRoute} />
            {excelRoute && (
                <div style={{ marginTop: '2rem' }}>
                    <h2>
                        Ruta Óptima desde Excel ({travelMode === 'driving' ? 'Carretera' : 'Caminando'})
                    </h2>
                    <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse' }}>
                        <thead>
                        <tr>
                            <th>ORDEN</th>
                            <th>DIRECCIÓN</th>
                            <th>ZONA</th>
                        </tr>
                        </thead>
                        <tbody>
                        {excelRoute.map((row, index) => (
                            <tr key={row.id}>
                                <td>{index + 1}</td>
                                <td>{row.direccion}</td>
                                <td>{row.zona}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <button onClick={handleDownloadExcel} style={{ marginTop: '1rem' }}>
                        Descargar Excel Ordenado
                    </button>
                </div>
            )}
        </div>
    );
}
