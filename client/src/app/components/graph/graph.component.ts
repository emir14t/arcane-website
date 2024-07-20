import { Component, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js/auto';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})

export class GraphComponent implements OnInit {
  chart: any;

  constructor(){}

  ngOnInit(): void {
    this.createTreeChart();
  }

  createTreeChart(): void {
    const ctx = document.getElementById('treeChart') as HTMLCanvasElement;
    const treeData: ChartData<'line'> = {
      labels: ['n', 'm1', 'm2', 'm3'],
      datasets: [
        {
          label: 'Tree Data',
          data: [
            { x: 0, y: 0 },  // n node
            { x: 1, y: 1 },  // m1 node
            { x: 1, y: -1 }, // m2 node
            { x: 2, y: 0 }   // m3 node
          ],
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 1,
          showLine: true,
          fill: false,
          pointRadius: 5
        }
      ]
    };

    const treeOptions: ChartOptions<'line'> = {
      responsive: true,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom'
        },
        y: {
          type: 'linear'
        }
      }
    };

    new Chart(ctx, {
      type: 'line',
      data: treeData,
      options: treeOptions
    } as ChartConfiguration);
  }
}
