import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Chart, LinearScale, PointElement, registerables } from 'chart.js';

Chart.register(...registerables, PointElement, LinearScale);

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit, AfterViewInit {
  data1: number[];
  data2: number[];
  data3: number[];
  data4: number[];
  time: number[];

  chart!: Chart;

  constructor() {
    this.data1 = Array(10).fill(0);
    this.data2 = Array(10).fill(1);
    this.data3 = Array(10).fill(2);
    this.data4 = Array(10).fill(3);  
    this.time = Array.from({ length: 10 }, (_, i) => i);
  }

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
        labels: this.time,
        datasets: [
          {
            label: 'Number of users',
            data: this.data1,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
          },
          {
            label: 'Total of mtx tx',
            data: this.data2,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
          },
          {
            label: 'Num of mtx tx handled by server',
            data: this.data3,
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
          },
          {
            label: 'Total transactions',
            data: this.data4,
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
          }
        ]
      },
      options: {
        plugins:{
          datalabels:{
            display: false,
          },
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
            display: true,
            position: 'right',
          }
        },
        responsive: true,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time interval'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Values in quantity'
            }
          }
        }
      }
    });
  }  
}

