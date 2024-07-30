import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor() { }

  private transactionArrivingSource = new BehaviorSubject<any>(0);
  private transactionLeavingSource = new BehaviorSubject<any>(0);
  private dataSource = new BehaviorSubject<number[]>([]);

  transactionArriving$ = this.transactionArrivingSource.asObservable();
  transactionLeaving$ = this.transactionLeavingSource.asObservable();
  data$ = this.dataSource.asObservable();


  transactionIsArriving(data: any) {
    this.transactionArrivingSource.next(data);
  }

  transactionIsLeaving(data: any) {
    this.transactionLeavingSource.next(data);
  }

  updateTxData(newData: number[]) {
    this.dataSource.next(newData);
  }

}
