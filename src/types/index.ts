export interface Coordinates {
    lat: number;
    lng: number;
}

export interface RouteData {
    route: google.maps.DirectionsRoute;
    travelMode: "walking" | "driving";
}