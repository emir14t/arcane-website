import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Chart, LinearScale, PointElement, registerables } from 'chart.js';
import { STATS_WINDOW } from 'src/app/constants';
import { TransactionService } from 'src/app/services/transaction.service';

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

  constructor(private transactionService: TransactionService) {
    // this.data1 = Array(STATS_WINDOW).fill(0);
    // this.data2 = Array(STATS_WINDOW).fill(1);
    // this.data3 = Array(STATS_WINDOW).fill(2);
    // this.data4 = Array(STATS_WINDOW).fill(3);  
    this.data1 = [];
    this.data2 = [];
    this.data3 = [];
    this.data4 = [];

    this.time = Array.from({ length: STATS_WINDOW }, (_, i) => i);
  }

  ngOnInit(): void {
    this.transactionService.data$.subscribe(newData => {
      if (this.chart) {
        this.updateChart(newData);
      }
    });
  }

  ngAfterViewInit(): void {
    // create and render the initial graph
    this.createGraphChart();
  }

  updateChart(data: number[]): void {
    if (this.chart) {
      this.data1.push(data[0]);
      this.data2.push(data[1]);
      this.data3.push(data[2]);
      this.data4.push(data[3]);
      this.time.push(this.time[this.time.length - 1] + 1);
  
      if (this.data1.length > STATS_WINDOW) { // Assuming you want to keep the size at 10
        this.data1.shift();
        this.data2.shift();
        this.data3.shift();
        this.data4.shift();
        this.time.shift();

        if(this.chart.options.scales !== undefined){
          if (this.chart.options.scales['x'] !== undefined) {
            this.chart.options.scales['x'].max = (this.chart.options.scales['x'].max) as number + 1;
          }
        }
      }
      
      this.chart.data.datasets[0].data = this.data1;
      this.chart.data.datasets[1].data = this.data2;
      this.chart.data.datasets[2].data = this.data3;
      this.chart.data.datasets[3].data = this.data4;
      this.chart.data.labels = this.time;
      this.chart.update();
    }
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
            },
            max: STATS_WINDOW,
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

