export interface Node {
    id : number,
    depth : number,
    breadth : number,
    parent : number | null,
    value: any,
}

export interface ChartContainer {
    labels: string[],
    dataset: any[],
    minX ?: number,
    maxX ?: number,
    maxY?: number,
}