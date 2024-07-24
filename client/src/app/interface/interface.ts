export interface Node {
    id : number,
    depth : number,
    breadth : number,
    parent : number | null,
    value: any,
}