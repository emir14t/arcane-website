import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Chart, LinearScale, PointElement, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { EdgeLine, TreeChart, TreeController } from 'chartjs-chart-graph';
import opacity from 'hex-color-opacity';
import { SERVER_BRANCHES_NUM } from 'src/app/constants';

Chart.register(...registerables, TreeController, TreeChart, EdgeLine, PointElement, LinearScale, ChartDataLabels);

@Component({
  selector: 'app-server-graph',
  templateUrl: './server-graph.component.html',
  styleUrls: ['./server-graph.component.scss']
})
export class ServerGraphComponent implements OnInit, AfterViewInit {

  // public variables
  // chart variables to not touch please
  chart!: TreeChart;
  nodeList: {x: number, y: number, parent?: number}[];
  labelList: string[];

  constructor() {
    this.nodeList = [];
    this.labelList = [];
  }

  ngOnInit(): void {
    // put some nodes to start
    this.initializeNodes();
  }

  ngAfterViewInit(): void {
    // create and render the initial graph
    this.createGraphChart();
  }

  private initializeNodes(): void {
    for (let i = 0; i < SERVER_BRANCHES_NUM; i++) {
      this.labelList.push(`branch #${i}`);
      this.nodeList.push({
          x: i,
          y: 1,
          parent: 0
      });
    }
    const x : number = this.nodeList.length/2;
    this.labelList.unshift('Server');
    this.nodeList.unshift({x, y:0});
  }

  private createGraphChart(): void {
    if (this.chart) {
      this.chart.destroy(); 
    }
    this.chart =  new TreeChart('serverChart', {
      plugins: [ChartDataLabels],
      data: {
        labels: this.labelList,
        datasets: [{
          data: this.nodeList,
        }]
      },
      options: {
        layout: {
          padding: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20
          }
        },
        plugins: {
          tooltip:{
            enabled: true,
            displayColors: false,
            backgroundColor: opacity('#5436EA', 0.75),
            bodyFont: {
              size: 16,
            },
            titleFont: {
              size: 20,
              weight: 'bold'
            },
          },
          title: {
            display: true,
            text: "Server and branches",
            color: '#0D0628',
            font: {
              size: 24,
              weight: 'bold'
            },
            padding: {
              bottom: 80
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x:{
            min:0,
            max: SERVER_BRANCHES_NUM
          },
          y:{
            min:0,
            max:1
          }
        }
      }
    });
  }
}
