"use client";

import React from "react";

import Metrics from "@/components/Metrics";
import Map from "@/components/Map";
import useRouteCalculation from "@/hooks/useRouteCalculation";
import SideBar from "@/components/SideBar";
import StopListSideBar from "@/components/StopListSideBar";



const HomePage = () => {
    const {
        optimizedRoutes,
        handleExcelResult,
        handleDownloadExcel,
        routePath,
        setRoutePath,
        menuOpen,
        setMenuOpen,
        travelMode,
        setTravelMode,
        startingAddress,
        setStartingAddress,
        startingZone,
        setStartingZone,
        loading,
        distance,
        duration,
        editableMarkers,
        setEditableMarkers,
        updateMarkerPosition,
        isEditing,
        setIsEditing,
        center,
        setCenter
    } = useRouteCalculation();

    return (
        <div style={{
            width: "100vw",
            height: "100vh",
            position: "fixed",
            top: 0,
            left: 0,
            margin: 0,
            padding: 0,
            fontFamily: "Arial, sans-serif"
        }}
             onClick={() => setMenuOpen(false)}>
            {
                distance !== null &&
                duration !== null &&
                (
                    <Metrics duration={duration} distance={distance} />
                )
            }
            <button
                style={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    zIndex: 1001,
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    transition: "left 0.3s ease-in-out"
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                }}
            >
                ☰
            </button>
            <SideBar
                menuOpen={menuOpen}
                startingAddress={startingAddress}
                setStartingAddress={setStartingAddress}
                startingZone={startingZone}
                setStartingZone={setStartingZone}
                travelMode={travelMode}
                setTravelMode={setTravelMode}
                handleExcelResult={handleExcelResult}
                loading={loading}
                handleDownloadExcel={handleDownloadExcel}
                optimizedRoutes={optimizedRoutes}
            />
            <StopListSideBar
                setCenter={setCenter}
                setEditable={setIsEditing}
                updateMarkerPosition={updateMarkerPosition}
                removeMarker={(index) => {
                    const updatedMarkers = editableMarkers.filter((_, i) => i !== index);
                    setEditableMarkers(updatedMarkers);
                }}
                editableMarkers={editableMarkers}
                setRoutePath={setRoutePath}
            />
            <Map
                center={center}
                routePath={routePath}
                editableMarkers={editableMarkers}
                updateMarkerPosition={updateMarkerPosition}
                isEditing={isEditing}
            />
        </div>
    );
};

export default HomePage;
