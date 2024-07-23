import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { EdgeLine, GraphController } from 'chartjs-chart-graph';
import { Node } from 'src/app/interface/interface';
import * as nodeData from 'src/app/sample-data/test-graph.json';
import opacity from 'hex-color-opacity';

Chart.register(...registerables, GraphController, EdgeLine);

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})

export class GraphComponent implements OnInit, AfterViewInit{

  nodes : Map<number, Node> = new Map<number, Node>();

  constructor() { }

  ngOnInit() : void {
    this.loadSampleData();
  }

  ngAfterViewInit() : void {
    this.createGraphChart();
  }

  createGraphChart(): void {
    const dataset : { x : number, y : number }[] = Array.from(this.nodes.values()).map(node => ({ x: node.depth, y: node.breadth }));
    new Chart('treeChart', {
      type: 'graph',
      data: {
        labels : Object.keys(this.nodes),
        datasets: [{
          data: dataset,
          edges : this.createEdges(),
          pointBackgroundColor: "#745ced",
          pointBorderColor: "#0D0628",
          pointRadius: 15,
          pointBorderWidth: 1,
          pointStyle: "rectRounded",
          borderWidth: 5,
          borderColor: opacity("#B100E8", 0.1),
        }]
      },
    });
  }

  loadSampleData(): void {
    const dataset = nodeData;
    const data = dataset.dataset as Node[];
    data.forEach((node: Node) => {
      this.nodes.set(node.id, node);
    });
  }

  createEdges(): { source: number, target: number }[] {

    const edges : { source: number, target: number }[] = [];
    const nodeArray = Array.from(this.nodes.values());
    const keysArray : number[] = Array.from(this.nodes.keys());

    // Iterate over each node
    nodeArray.forEach((node) => {
      const sourceIndex = keysArray.indexOf(node.id);

      // Add edges for child nodes
      node.childs.forEach(childId => {
        if (this.nodes.get(childId)) {
          edges.push({ source: sourceIndex, target: keysArray.indexOf(childId) });
        }
      });

      // Add edges for neighbor nodes
      // node.neighbors.forEach(neighborId => {
      //   if (this.nodes.get(neighborId)) {
      //     edges.push({ source: sourceIndex, target: keysArray.indexOf(neighborId) });
      //   }
      // });

      // Add edge for parent node (if it exists)
      if (node.parent !== null && this.nodes.get(node.parent)) {
        edges.push({ source: sourceIndex, target: keysArray.indexOf(node.parent) });
      }
    });
    return edges;
  }
}