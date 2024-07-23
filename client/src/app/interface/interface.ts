export interface Node {
    id : number,
    depth : number,
    breadth : number,
    parent : number | null,
    childs : number[],
    neighbors : number[],
}