import React, { useState } from "react";
import { OptimizedExcelRow } from "@/lib/calculateOptimalRoute";
import { LatLngExpression } from "leaflet";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface StopListSideBarProps {
    editableMarkers: OptimizedExcelRow[];
    setRoutePath: (route: any) => void;
    updateMarkerPosition: (index: number, lat: number, lng: number, newDirection: string) => void;
    removeMarker: (index: number) => void;
    setEditable: (editable: boolean) => void;
    setCenter: (coordinates: LatLngExpression) => void;
    reorderMarkers: (sourceIndex: number, destinationIndex: number) => void;
    recalculateRoutes: boolean;
    setRecalculateRoutes: (recalculate: boolean) => void;
}

const StopListSideBar = (
    {
        editableMarkers,
        updateMarkerPosition,
        removeMarker,
        setEditable,
        setCenter,
        reorderMarkers,
        recalculateRoutes,
        setRecalculateRoutes
    }: StopListSideBarProps) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editedValue, setEditedValue] = useState<{ direccion: string; coordenadas: string }>({ direccion: "", coordenadas: "" });

    if (!editableMarkers || editableMarkers.length === 0) return null;

    const handleEditClick = (index: number, direccion: string, coordenadas: string) => {
        setEditingIndex(index);
        setEditedValue({ direccion, coordenadas });
        setEditable(true);
    };

    const handleSave = (index: number) => {
        const [lat, lng] = editedValue.coordenadas.split(",").map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
            updateMarkerPosition(index, lat, lng, editedValue.direccion);
        } else {
            alert("Por favor, ingrese coordenadas válidas.");
        }
        setEditingIndex(null);
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        reorderMarkers(result.source.index, result.destination.index);
    };

    return (
        <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 1002,
            background: "#ffffff",
            padding: "15px",
            height: "100vh",
            width: "300px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            overflowY: "auto",
            borderRadius: "10px",
            color: "black"
        }}>
            <h3 style={{ textAlign: "center", marginBottom: "10px", fontSize: "1.2rem", fontWeight: "bold" }}>Paradas</h3>
            <label>
                <input type="checkbox" checked={recalculateRoutes} onChange={() => setRecalculateRoutes(!recalculateRoutes)} />
                Recalcular ruta al cambiar orden
            </label>
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="stops-list">
                    {(provided) => (
                        <ul {...provided.droppableProps} ref={provided.innerRef} style={{ listStyleType: "none", padding: 0 }}>
                            {editableMarkers.map((row, index) => (
                                <Draggable key={`marker-${index}`} draggableId={`marker-${index}`} index={index}>
                                    {(provided) => (
                                        <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{
                                            ...provided.draggableProps.style,
                                            background: "#f8f9fa",
                                            padding: "10px",
                                            borderRadius: "5px",
                                            marginBottom: "10px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-start",
                                            boxShadow: "2px 2px 5px rgba(0,0,0,0.1)",
                                            cursor: "grab"
                                        }}>
                                            {editingIndex === index ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editedValue.direccion}
                                                        onChange={(e) => setEditedValue({ ...editedValue, direccion: e.target.value })}
                                                        style={{ width: "100%", marginBottom: "5px", padding: "5px" }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editedValue.coordenadas}
                                                        onChange={(e) => setEditedValue({ ...editedValue, coordenadas: e.target.value })}
                                                        style={{ width: "100%", marginBottom: "5px", padding: "5px" }}
                                                    />
                                                    <button onClick={() => handleSave(index)} style={{
                                                        background: "#28a745",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "5px",
                                                        borderRadius: "5px",
                                                        cursor: "pointer",
                                                        width: "100%",
                                                        marginBottom: "5px"
                                                    }}>Guardar</button>
                                                </>
                                            ) : (
                                                <>
                                                    <p onClick={() => setCenter([parseFloat(row.coordenadas.split(", ")[0]), parseFloat(row.coordenadas.split(", ")[1])])} style={{ cursor: "pointer", color: "#007bff", textDecoration: "underline", marginBottom: "5px" }}>
                                                        {index + 1}. {row.direccion} ({row.coordenadas})
                                                    </p>
                                                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                                                        <button onClick={() => handleEditClick(index, row.direccion, row.coordenadas)} style={{
                                                            background: "#ffc107",
                                                            color: "black",
                                                            border: "none",
                                                            padding: "5px",
                                                            borderRadius: "5px",
                                                            cursor: "pointer",
                                                            width: "48%"
                                                        }}>Editar</button>
                                                        <button onClick={() => removeMarker(index)} style={{
                                                            background: "#dc3545",
                                                            color: "white",
                                                            border: "none",
                                                            padding: "5px",
                                                            borderRadius: "5px",
                                                            cursor: "pointer",
                                                            width: "48%"
                                                        }}>Eliminar</button>
                                                    </div>
                                                </>
                                            )}
                                        </li>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </ul>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};

export default StopListSideBar;
