export function swapElements<T>(array: T[], sourceIndex: number, destinationIndex: number): T[] {
    if (
        sourceIndex < 0 || sourceIndex >= array.length ||
        destinationIndex < 0 || destinationIndex >= array.length
    ) {
        console.error("Índices fuera de rango");
        return array;
    }

    [array[sourceIndex], array[destinationIndex]] = [array[destinationIndex], array[sourceIndex]];

    return array;
}