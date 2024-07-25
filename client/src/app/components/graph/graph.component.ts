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
      // labels.push(node.value.toString().replace(/,/g, '|'));
      labels.push(node.value.toString());
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
          pointRadius: 5,
          // pointBackgroundColor: '#F4F6FC',
          pointBorderWidth: 3,
          pointBorderColor: '#5436EA',
          borderWidth: 5,
          borderColor: opacity('#B100E8', 0.1),

          pointBackgroundColor: (context) => {
              const labels = context.chart.data.labels;
              if (labels) {
                const label = labels[context.dataIndex];
                const values = (label as string).split(',').map(id => Number(id));
                let maxCount = 0;

                for (let value of values) {
                  if (this.InTransactionNode.has(value)) {
                    maxCount++;
                  }
                }
                // Interpolate between two colors based on the count
                const factor = this.calculateColorFactor(maxCount, values.length);
                let color: string = this.lerpColor('#F4F6FC', '#B100E8', factor);
                return color;
              }
              return '#745ced';
            }, 
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
            callbacks: {
              title: function(tooltipItems) {
                const item = tooltipItems[0];
                return 'Shard ID : ' + (item.dataIndex + 1);
              },
              label: (tooltipItem: any) => {
                const { dataIndex, chart } = tooltipItem;
                const labels = chart.data.labels as string[] || []; 
                const userList = labels[dataIndex] || 'N/A';
                const userIds = userList.split(',').map(id => Number(id));
                const transactionIds = userIds.filter(userId => { return this.InTransactionNode.has(userId); });           
                return [
                  `User List: ${userList}`,
                  `User in Transaction: ${transactionIds.join(', ')}`
                ];
              },      
            }    
          },
          title: {
            display: true,
            text: "Methex Architecture Simulation Of User Based Set Up",
            color: '#0D0628',
            font: {
              size: 24,
              weight: 'bold'
            },
            padding: {
              bottom: 80
            }
          },
          datalabels: {
            labels:{
              index: {
                align: 'end',
                anchor: 'end',
                color: "#B100E8",
                font: {size: 16},
                formatter: function(value, ctx) {
                  return (ctx.dataIndex + 1).toString();
                },
              },
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

  private lerpColor(a : string, b : string, amount: number) { 
    var ah = +a.replace('#', '0x'),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh =  +b.replace('#', '0x'),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);
    const hexColor : string = '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
    return hexColor;
  }

  private calculateColorFactor(value: number, total: number): number {
    const r = Math.min(1, value / total)
    return r;
  }
  
}
