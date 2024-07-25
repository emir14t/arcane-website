import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit, AfterViewInit {
  data1: number[] = Array(10).fill(0);
  data2: number[] = Array(10).fill(1);
  data3: number[] = Array(10).fill(2);
  data4: number[] = Array(10).fill(3);

  chart!: Chart;

  constructor() {}

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    // create and render the initial graph
    this.createGraphChart();
  }

  createGraphChart(): void {
    if (this.chart) {
      this.chart.destroy(); 
    }
  
    this.chart = new Chart('chart', {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Number of users',
            data: this.data1,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false
          },
          {
            label: 'Total of mtx tx',
            data: this.data2,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: false
          },
          {
            label: 'Num of mtx tx handled by server',
            data: this.data3,
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            fill: false
          },
          {
            label: 'Total transactions',
            data: this.data4,
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            fill: false
          }
        ]
      },
      options: {
        plugins:{
          title:{
            display: true,
            text: "Simulation stats",
            color: '#B100E8',
            font: {
              size: 24,
              weight: 'bold'
            },
            padding: {
              bottom: 40
            }
          },
          legend:{
            display:true,
            position: 'right',
          }
        },
        responsive: true,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'X-Axis'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Y-Axis'
            }
          }
        }
      }
    });
  }  
}

