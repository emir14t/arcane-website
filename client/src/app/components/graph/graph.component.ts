import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';

// chart import
import { Chart, LinearScale, PointElement, registerables } from 'chart.js';
import { TreeController, TreeChart, EdgeLine } from 'chartjs-chart-graph';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import opacity from 'hex-color-opacity';

// our own code import
import { Node, ChartContainer, Transaction } from 'src/app/interface/interface';
import { User, UserManagementNode } from '../class/user_btree';
import { INITIAL_NODE_ID, MAX_DEGREE, INITIAL_NODE_NUMBER, SERVER_ID, ADDING_USER_PROBABILITY, DELETE_USER_PROBABILITY, TRANSACTION_PROBABILITY, SIM_TICK} from 'src/app/constants';
import { TransactionService } from 'src/app/services/transaction.service';
import { Subscription } from 'rxjs';
import { BNode } from '../class/btree';

Chart.register(...registerables, TreeController, TreeChart, EdgeLine, PointElement, LinearScale, ChartDataLabels);

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})

export class GraphComponent implements OnInit, OnDestroy, AfterViewInit {

  // public variables
  // chart variables to not touch please
  nodes: Map<number, Node>;
  intervalId: any;
  chart!: TreeChart;
  chartCharacteristic: ChartContainer = { dataset: [], labels: [], edges: [] };

  // sim backend variables
  tree: UserManagementNode;
  usersSet : Set<User>;

  // stats variables 
  InTransactionNode: Set<number>;
  transactionNum : number = 0;
  mtxTx : number = 0;
  serverMtxTx : number = 0;

  // private variables
  private transactionSub: Subscription[] = [];

  constructor(private transactionService: TransactionService) {
    this.tree = new UserManagementNode(undefined, MAX_DEGREE, new BNode<User>(undefined, 10), this.transactionService);
    this.nodes = new Map<number, Node>();
    this.InTransactionNode = new Set();
    this.usersSet = new Set();
  }

  ngOnInit(): void {
    this.transactionService.transactionArriving$.subscribe(u => {
      if(u === SERVER_ID){return;}
      this.InTransactionNode.add(u);
    });

    this.transactionService.transactionLeaving$.subscribe(u => {
      if(u === SERVER_ID){
        this.serverMtxTx += 1;
        return;
      }
      if(this.InTransactionNode.delete(u)){
        this.mtxTx += 1;
      }
    });

    // put some nodes to start
    this.initializeNodes();
    // setup tick frequency for user agents
    this.intervalId = setInterval(() => this.handleTick(), SIM_TICK);
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
    this.nodes = this.tree.UserManagementNode_tree_to_node_map();
    this.updateChartCharacteristic();
    this.createGraphChart();
  }

  private initializeNodes(): void {
    this.usersSet.add(this.tree.insert_child(INITIAL_NODE_ID, `${INITIAL_NODE_ID}`));
    for (let i = 1; i <= INITIAL_NODE_NUMBER; i++) {
      let random = Math.random() * 10;
      this.usersSet.add(this.tree.insert_child(i, `${random}`));
    }
  }

  handleTick(): void {
    const simpleRand : number = Math.random();
    const random : number = Math.trunc(simpleRand * 100);
    const deleteRange = ADDING_USER_PROBABILITY + DELETE_USER_PROBABILITY;

    if (random <= ADDING_USER_PROBABILITY) {
      const uniqueId = Number(Math.random().toString().substring(2,9));
      this.usersSet.add(this.tree.insert_child(uniqueId, `${random}`));
    }
    else if(random > ADDING_USER_PROBABILITY && random <= deleteRange){
      const userArray : User[] = Array.from(this.usersSet);
      const userToDelete : User = userArray[(random % userArray.length)];
      this.usersSet.delete(userToDelete);
      this.tree = this.tree.delete(userToDelete.get_id());
    }

    // making the user agent do a random actin
    this.usersSet.forEach(u => this.handleAgent(u));
    this.nodes = this.tree.UserManagementNode_tree_to_node_map();
    this.updateChart();

    // update the stats 
    const stats : number[] = [];
    stats.push(this.usersSet.size);
    stats.push(this.mtxTx);
    stats.push(this.serverMtxTx);
    stats.push(this.transactionNum);
    this.transactionService.updateTxData(stats);
    this.mtxTx = 0;
    this.serverMtxTx = 0;
    this.transactionNum = 0;
  }

  handleAgent(user : User): void {
    const simpleRand : number = Math.random();
    const random : number = Math.trunc(simpleRand * 100);
    if (random <= TRANSACTION_PROBABILITY) {
      const transaction: Transaction = { writes: ['hello'], reads: ['world'] };
      const userArray : User[] = Array.from(this.usersSet);
      const randomIndex = Math.floor(simpleRand * userArray.length);
      const tragetId = userArray[randomIndex].get_id();
      user.send_transaction(transaction, [tragetId]);
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
        // maintainAspectRatio: false,
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
            text: "Simulation Of Branch #1",
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
