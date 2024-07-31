import { Component, OnInit } from '@angular/core';
import { STATS_WINDOW } from 'src/app/constants';
import { TransactionService } from 'src/app/services/transaction.service';

@Component({
  selector: 'app-stats-table',
  templateUrl: './stats-table.component.html',
  styleUrls: ['./stats-table.component.scss']
})
export class StatsTableComponent implements OnInit {

  private history: { [key: number]: number[] } = {}; 
  private initialValues: number[] = []; 
  rows: { column0: string, column1: number, column2: number, column3: number, column4: number }[];
  
  constructor(private transactionService: TransactionService) {
    this.rows = [
      { column0: 'Number of User (NbU)', column1: 0, column2: 0, column3: 0, column4: 0},
      { column0: 'Number of Communication between Users (Mtx)', column1: 0, column2: 0, column3: 0, column4: 0},
      { column0: 'Number of tx handly by the Server (Stx)', column1: 0, column2: 0, column3: 0, column4: 0 },
      { column0: 'Number of Transactions (Tx)', column1: 0, column2: 0, column3: 0, column4: 0 }
    ];
  }

  ngOnInit(): void {
    this.transactionService.data$.subscribe(newData => {
      this.updateValues(newData);
    });
  }

  updateValues(newData: number[]): void {
    if (newData.length !== 4) {
      console.error('Invalid data received. Expected 4 values.');
      return;
    }
    
    // Update history and initial values
    for (let i = 0; i < this.rows.length; i++) {
      const newValue = newData[i];
      
      // Initialize history and initial values if not already set
      if (this.history[i] === undefined) {
        this.history[i] = [];
      }
      if (this.initialValues[i] === undefined || this.initialValues[i] === 0) {
        this.initialValues[i] = newValue;
      }

      // Update history
      this.history[i].push(newValue);
      const valuesArray : number[] = this.history[i];
      if(valuesArray.length > STATS_WINDOW){
        this.history[i].shift();
      }

      // Calculate moving average
      const movingAverage = this.calculateMovingAverage(this.history[i]);

      // Calculate percentage variation since the simulation started
      const percentageVariation = this.calculatePercentageVariation(movingAverage, this.initialValues[i]);

      // Calculate volatility
      const volatility = this.calculateVolatility(this.history[i]);

      // Update rows
      const row = this.rows[i];
      row.column1 = newValue;
      row.column2 = parseFloat(movingAverage.toFixed(2));
      row.column3 = parseFloat(percentageVariation.toFixed(2));
      row.column4 = parseFloat(volatility.toFixed(2));
      this.rows[i] = row;
    }
  }

  calculateMovingAverage(values: number[]): number {
    const sum = values.reduce((acc, val) => acc + val, 0);
    return values.length ? sum / values.length : 0;
  }

  calculatePercentageVariation(currentValue: number, initialValue: number): number {
    if (initialValue === 0) return 0;
    return ((currentValue - initialValue) / initialValue) * 100;
  }

  calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = this.calculateMovingAverage(values);
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }
}
