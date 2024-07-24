import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';

// chart import
import { Chart, registerables } from 'chart.js';
import { TreeController, EdgeLine } from 'chartjs-chart-graph';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import opacity from 'hex-color-opacity';

// our own code import
import { Node, ChartContainer } from 'src/app/interface/interface';
import { BNode } from '../class/b-tree';
import { MAX_DEGREE } from 'src/app/constants';
import { TransactionService } from 'src/app/services/transaction.service';
// import { Transaction } from 'src/app/interface/interface';

Chart.register(...registerables, TreeController, EdgeLine, ChartDataLabels);

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})

export class GraphComponent implements OnInit, OnDestroy, AfterViewInit{

  // chart variables
  nodes : Map<number, Node> = new Map<number, Node>();
  intervalId : any;
  chart : any;
  chartCharacteristic : ChartContainer = {dataset:[], labels:[]};

  // tree variable 
  tree : BNode<number>;
  users : number[];

  constructor(private transactionService: TransactionService) { 
    this.tree = new BNode(undefined, MAX_DEGREE);
    this.users = [];
  }

  ngOnInit() : void {
    // set up observer for transaction
    this.transactionService.transactionArriving$.subscribe(node => {
      console.log('Transaction is arriving:', node.id);
    });

    this.transactionService.transactionLeaving$.subscribe(node => {
      console.log('Transaction is leaving:', node.id);
    });

    // set initial nodes
    this.tree.insert_child(0, 0);
    for(let i = 25; i !=1; i--) {
      let random = Math.random() * 10;
      this.tree.insert_child(i, random);
    }
    
    // set the tick for making the simulation agent
    this.intervalId = setInterval(() => {
      const randomNumber = Math.floor(Math.random() * 100); // Generates a random number between 0 and 99
      this.handleTick(randomNumber);
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  ngAfterViewInit() : void {
    this.nodes = this.tree.bnode_tree_to_node_map();
    this.updateChartCharacteristic();
    this.createGraphChart();
  }

  handleTick(r : number) : void {
    if(r <= 25){
      const timestamp = Math.trunc(Date.now() / 1000) % 10000;
      this.tree.insert_child(timestamp, r);
    }
    Array.from(this.nodes.values()).forEach(node => {
      this.handleAgent(node, r);
    });
    this.nodes = this.tree.bnode_tree_to_node_map();
    this.updateChart();
  }

  handleAgent(node : Node, r : number) : void {
    const action : number =  r % node.id % 3;
    switch(action) {
      case 1:
        // console.log("Transaction from: " + node.id);
        // this.tree.create_transaction
        break;
      case 2:
        this.tree = this.tree.delete(node.id);
        break;
      case 3:
        // console.log("Transaction from: " + node.id);
        break;
      default:
        // do nothing
        return;
    } 
  }

  updateChart(){
    this.updateChartCharacteristic();
    this.chart.config.data.labels = this.chartCharacteristic.labels;
    this.chart.config.data.datasets.data = this.chartCharacteristic.dataset;
    this.chart.options.scales.x.min = this.chartCharacteristic.minX;
    this.chart.options.scales.x.max = this.chartCharacteristic.maxX;
    this.chart.options.scales.y.max = this.chartCharacteristic.maxY;
    this.chart.update();
  }

  updateChartCharacteristic(){
    const nodesArray = Array.from(this.nodes.values());
  
    // Calculate the maximum breath at each depth level
    const maxBreadthAtDepth: { [key: number]: number } = {};
    nodesArray.forEach(node => {
      if (!maxBreadthAtDepth[node.depth] || node.breadth > maxBreadthAtDepth[node.depth]) {
        maxBreadthAtDepth[node.depth] = node.breadth;
      }
    });
  
    // Calculate the maximum depth
    const maxDepth = Math.max(...nodesArray.map(node => node.depth));
  
    // Calculate the offsets and scaling factors for each depth level
    const xOffsetAtDepth: { [key: number]: number } = {};
    const scalingFactorAtDepth: { [key: number]: number } = {};
    for (const depth in maxBreadthAtDepth) {
      const maxBreadth = maxBreadthAtDepth[depth];
      xOffsetAtDepth[depth] = maxBreadth / 2;
      scalingFactorAtDepth[depth] = (1 - (parseInt(depth) / maxDepth)) * 0.5 + 0.5;
    }
  
    // Create dataset with adjusted x positions
    this.chartCharacteristic.dataset = nodesArray.map(node => ({
      x: (node.breadth - xOffsetAtDepth[node.depth]) * scalingFactorAtDepth[node.depth],
      y: node.depth
    }));
  
    // Determine the overall min and max x values for scaling
    this.chartCharacteristic.minX = Math.min(...this.chartCharacteristic.dataset.map(point => point.x));
    this.chartCharacteristic.maxX = Math.max(...this.chartCharacteristic.dataset.map(point => point.x));
    this.chartCharacteristic.maxY = Math.max(...this.chartCharacteristic.dataset.map(point => point.y));

    // Determine the labels of each node
    this.chartCharacteristic.labels = Array.from(this.nodes.values()).map(node => (node.value.toString().replace(/,/g, '|')));
  }

  createGraphChart(): void {  
    this.chart = new Chart('treeChart', {
      plugins: [ChartDataLabels],
      type: 'tree',
      data: {
        labels: this.chartCharacteristic.labels,
        datasets: [{
          label: 'User Shard',
          data: this.chartCharacteristic.dataset,
          edges: this.createEdges(),
          pointRadius: 1,
          pointBorderWidth: 0,
          borderWidth: 5,
          borderColor: opacity('#B100E8', 0.1),
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "Methex Architecture Simulation Of User Based Set Up",
            color: '#B100E8',
            font: {
              size: 24,
              weight: 'bold',
            },
          },
          datalabels: {
            color: '#745ced',
            backgroundColor: '#F4F6FC',
            borderColor: '#745ced',
            borderWidth: 2,
            formatter: function(value, context) {
              const labels = context.chart.data.labels;
              // Check if labels are defined and context.dataIndex is valid
              if (labels && context.dataIndex < labels.length) {
                  return labels[context.dataIndex];
              }
              // Return a default value if labels are undefined or dataIndex is out of bounds
              return 'No Label';
            },
            font: {
              size: 12,
              weight: 'bold',
            },
          },
          legend: {
            display: false,
          }
        },
        scales: {
          y: {
            reverse: false,
            min: 0,
            max: this.chartCharacteristic.maxY ? this.chartCharacteristic.maxY * 1.05 : 0,
          },
          x: {
            // the 1.05 is a tamporary fix so that the label always display properly by giving 5% marging to the axis
            min: this.chartCharacteristic.minX ? this.chartCharacteristic.minX * 1.05 : 0,
            max: this.chartCharacteristic.maxX ? this.chartCharacteristic.maxX * 1.05 : 0,
          }
        },
        layout: {
          padding: {
            left: 20,
            top: 20,
            bottom: 20,
            right: 20,
          },
        },
      }
    });
  }
  
  createEdges(): { source: number, target: number }[] {

    const edges : { source: number, target: number }[] = [];
    const nodeArray = Array.from(this.nodes.values());
    const keysArray : number[] = Array.from(this.nodes.keys());

    // Iterate over each node
    nodeArray.forEach((node) => {
      const sourceIndex = keysArray.indexOf(node.id);

      // Add edge for parent node (if it exists)
      if (node.parent !== null && this.nodes.get(node.parent)) {
        edges.push({ source: sourceIndex, target: keysArray.indexOf(node.parent) });
      }
    });
    return edges;
  }
}