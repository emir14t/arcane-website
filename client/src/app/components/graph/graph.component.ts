import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { EdgeLine, GraphController } from 'chartjs-chart-graph';

Chart.register(...registerables, GraphController, EdgeLine);

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})

export class GraphComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
    this.createGraphChart();
  } 

  createGraphChart(): void {
    const ctx = document.getElementById('treeChart') as HTMLCanvasElement;

    new Chart(ctx, {
      type: 'graph',
      data: {
        labels: ['A', 'B', 'C'], // node labels
        datasets: [{
          data: [ // nodes as objects
            { x: 1, y: 2 }, // x, y will be set by the force directed graph and can be omitted
            { x: 3, y: 1 },
            { x: 5, y: 3 }
          ],
          edges: [ // edge list where source/target refers to the node index
            { source: 0, target: 1},
            { source: 0, target: 2}
          ]
        }]
      },
    });
  }

}