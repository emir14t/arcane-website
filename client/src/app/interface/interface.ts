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
    edges : { source: number, target: number }[],
    minX ?: number,
    maxX ?: number,
    maxY?: number,
}

export interface Transaction{
    writes: any[],
    reads: any[]
}
  
export interface Table {
    column1 : number,
    column2 : number,
    column3 : number,
}