// src/components/ExcelUpload.tsx
'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {ExcelRowData} from "@/lib/calculateOptimalRoute";

interface ExcelUploadProps {
    onResult: (data: ExcelRowData[]) => void;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onResult }) => {
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        // Lee el archivo como ArrayBuffer
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Convertimos la hoja a JSON (cada fila es un objeto)
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        // Extraemos las columnas "DIRECCION" y "ZONA"
        const result: ExcelRowData[] = jsonData.map(row => ({
            data: row, // guarda toda la fila original
            direccion: row['DIRECCION'] || row['Direccion'] || '',
            zona: row['Localidad'] || row['LOCALIDAD'] || '',
        })).filter(item => item.direccion !== '');

        onResult(result);
        setLoading(false);
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="excelUpload">Cargar archivo Excel (.xlsx o .xls):</label>
            <input type="file" id="excelUpload" accept=".xlsx, .xls" onChange={handleFileUpload} />
            {loading && <p>Procesando archivo...</p>}
        </div>
    );
};

export default ExcelUpload;

