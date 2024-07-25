import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';

// chart import
import { Chart, LinearScale, PointElement, registerables } from 'chart.js';
import { TreeController, TreeChart, EdgeLine } from 'chartjs-chart-graph';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import opacity from 'hex-color-opacity';

// our own code import
import { Node, ChartContainer, Transaction } from 'src/app/interface/interface';
import { BNode } from '../class/b-tree';
import { INITIAL_NODE_ID, MAX_DEGREE, NUMBER_OF_INITIAL_NODE, PROBABILITY_OF_ADDING_USER } from 'src/app/constants';
import { TransactionService } from 'src/app/services/transaction.service';
import { Subscription } from 'rxjs';
// import { Transaction } from 'src/app/interface/interface';

Chart.register(...registerables, TreeController, TreeChart, EdgeLine, PointElement, LinearScale, ChartDataLabels);

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})

export class GraphComponent implements OnInit, OnDestroy, AfterViewInit {

  // public variables
  nodes: Map<number, Node>;
  intervalId: any;
  chart!: TreeChart;
  chartCharacteristic: ChartContainer = { dataset: [], labels: [], edges: [] };
  tree: BNode<number>;
  usersID: Set<number>;
  InTransactionNode: Set<number>;

  transactionNum : number = 0;
  mtxTx : number = 0;
  serverMtxTx : number = 0;

  // private variables
  private transactionSub: Subscription[] = [];

  constructor(private transactionService: TransactionService) {
    this.tree = new BNode(undefined, MAX_DEGREE, this.transactionService);
    this.nodes = new Map<number, Node>();
    this.usersID = new Set();
    this.InTransactionNode = new Set();
  }

  ngOnInit(): void {
    // setup transaction observers
    // this.transactionSub.push(this.transactionService.transactionArriving$.subscribe(userId => {
    //   this.InTransactionNode.add(userId);
    // }));
    this.transactionService.transactionArriving$.subscribe(userId => {
      this.InTransactionNode.add(userId);
    });

    this.transactionService.transactionLeaving$.subscribe(userId => {
      if(this.InTransactionNode.delete(userId)){
        if(this.tree === this.tree.search(userId)){
          this.serverMtxTx += 1;
        }
        else {
          this.mtxTx += 1;
        }
      }
    });

    // this.transactionSub.push(this.transactionService.transactionLeaving$.subscribe(userId => {
    //   this.InTransactionNode.delete(userId);
    //   // console.log(userId);
    // }));

    // put some nodes to start
    this.initializeNodes();
    // setup tick frequency for user agents
    this.intervalId = setInterval(() => this.handleTick(Math.floor(Math.random() * 100)), 1000);
  }

  ngOnDestroy(): void {
    // Destroy all observers
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.transactionSub.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewInit(): void {
    // create and render the initial graph
    this.nodes = this.tree.bnode_tree_to_node_map();
    this.updateChartCharacteristic();
    this.createGraphChart();
  }

  private initializeNodes(): void {
    this.tree.insert_child(INITIAL_NODE_ID, INITIAL_NODE_ID);
    this.usersID.add(INITIAL_NODE_ID);
    for (let i = 1; i <= NUMBER_OF_INITIAL_NODE; i++) {
      let random = Math.random() * 10;
      this.tree.insert_child(i, random);
      this.usersID.add(i);
    }
  }

  handleTick(randomNumber: number): void {
    if (randomNumber <= PROBABILITY_OF_ADDING_USER) {
      // get each second a different number of 3 numbers
      const timestamp = Math.trunc(Date.now() / 1000) % 10000;
      this.tree.insert_child(timestamp, randomNumber);
      this.usersID.add(timestamp);
    }

    // making the user agent do a random actin
    this.usersID.forEach(id => this.handleAgent(id));
    this.nodes = this.tree.bnode_tree_to_node_map();
    this.updateChart();

    const stats : number[] = [];
    // const mTx : number = this.mtxTx - this.transactionNum;
    stats.push(this.usersID.size);
    stats.push(this.mtxTx);
    stats.push(this.serverMtxTx);
    stats.push(this.transactionNum);
    this.transactionService.updateTxData(stats);
    this.mtxTx = 0;
    this.serverMtxTx = 0;
    this.transactionNum = 0;
  }

  handleAgent(id: number): void {
    const action = (Math.trunc(Math.random() * 10)) % 3;
    if (action === 1) {
      const transaction: Transaction = { writes: [id], reads: [id] };
      this.tree.search(id)?.create_transaction(transaction);
      this.transactionNum += 1;
    }
    // Add other actions as needed
  }

  updateChart(): void {
    this.updateChartCharacteristic();
    this.chart.data.labels = this.chartCharacteristic.labels;
    this.chart.data.datasets[0].data = this.chartCharacteristic.dataset;
    this.chart.data.datasets[0].edges = this.chartCharacteristic.edges;

    if(this.chart.options.scales !== undefined){
      if (this.chart.options.scales['x'] !== undefined) {
        this.chart.options.scales['x'].min = this.chartCharacteristic.minX;
        this.chart.options.scales['x'].max = this.chartCharacteristic.maxX;
      }
      if (this.chart.options.scales['y'] !== undefined) {
        this.chart.options.scales['y'].max = this.chartCharacteristic.maxY;
      } 
    }
    this.chart.update();
  }

  updateChartCharacteristic(): void {
    const nodesArray = Array.from(this.nodes.values());
    const maxBreadthAtDepth: { [key: number]: number } = {};
    const labels : string[] = [];
    const edges : { source: number, target: number }[] = [];
    let maxDepth = 0;

    // loop and trough the node to get current characteristique of the graph
    nodesArray.forEach((node, index) => {
      // setup a max breath at every layer
      maxBreadthAtDepth[node.depth] = Math.max(maxBreadthAtDepth[node.depth] || 0, node.breadth);
      maxDepth = Math.max(maxDepth, node.depth);

      // set the labels with the good format
      labels.push(node.value.toString().replace(/,/g, '|'));
      // set the edges at the good format
      if(node.parent !== null && node.parent !== undefined){
        const nodeArray : number[] = Array.from(this.nodes.keys());
        const target :  number = nodeArray.indexOf(node.parent);
        edges.push({source: index, target: target});
      }
    });

    // set the chart labels and edges for the graph 
    this.chartCharacteristic.labels = [...labels];
    this.chartCharacteristic.edges = [...edges];

    const xOffsetAtDepth: { [key: number]: number } = {};
    const scalingFactorAtDepth: { [key: number]: number } = {};

    // calculate scalling at every depth
    for (const depth in maxBreadthAtDepth) {
      const maxBreadth = maxBreadthAtDepth[depth];
      xOffsetAtDepth[depth] = maxBreadth / 2;
      scalingFactorAtDepth[depth] = (1 - (+depth / maxDepth)) * 0.5 + 0.5;
    }

    // apply scalling at every depth to center the dataset and make it smooth
    let minX = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.chartCharacteristic.dataset = nodesArray.map(node => {
      const x = (node.breadth - xOffsetAtDepth[node.depth]) * scalingFactorAtDepth[node.depth];
      const y = node.depth;
  
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
  
      return { x, y };
    });
    
    // setup chart limit for the view port 
    this.chartCharacteristic.minX = minX;
    this.chartCharacteristic.maxX = maxX;
    this.chartCharacteristic.maxY = maxY;
  }

  createGraphChart(): void {
    if (this.chart) {
      this.chart.destroy(); 
    }
    this.chart =  new TreeChart('treeChart', {
      plugins: [ChartDataLabels],
      data: {
        labels: this.chartCharacteristic.labels,
        datasets: [{
          label: 'User Shard',
          data: this.chartCharacteristic.dataset,
          edges: this.chartCharacteristic.edges,
          pointRadius: 1,
          pointBorderWidth: 0,
          borderWidth: 5,
          borderColor: opacity('#B100E8', 0.1),
        }]
      },
      options: {
        animation: false,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20
          }
        },
        plugins: {
          title: {
            display: true,
            text: "Methex Architecture Simulation Of User Based Set Up",
            color: '#B100E8',
            font: {
              size: 24,
              weight: 'bold'
            },
            padding: {
              bottom: 40
            }
          },
          datalabels: {
            color: (context) => {
              const labels = context.chart.data.labels;
              if (labels) {
                const label = labels[context.dataIndex];
                const values = (label as any).split('|').map(Number);
                for (let value of values) {
                  if (this.InTransactionNode.has(value)) {
                    return '#B100E8'; // Change color to red if the value is in the set
                  }
                }
              }
              return '#745ced'; // Default color
            },
            backgroundColor: '#F4F6FC',
            borderColor: '#745ced',
            borderWidth: 2,
            formatter: (value, context) => {
              const labels = context.chart.data.labels;
              return labels ? labels[context.dataIndex] : 'No Users';
            },
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            display: false,
            min: this.chartCharacteristic.minX,
            max: this.chartCharacteristic.maxX,
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10
            }
          },
          y: {
            display: false,
            min: 0,
            max: this.chartCharacteristic.maxY,
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10
            }
          }
        }
      }
    });
  }
}
