import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor() { }

  private transactionArrivingSource = new BehaviorSubject<number>(0);
  private transactionLeavingSource = new BehaviorSubject<number>(0);
  private dataSource = new BehaviorSubject<number[]>([]);

  transactionArriving$ = this.transactionArrivingSource.asObservable();
  transactionLeaving$ = this.transactionLeavingSource.asObservable();
  data$ = this.dataSource.asObservable();


  transactionIsArriving(id: number) {
    this.transactionArrivingSource.next(id);
  }

  transactionIsLeaving(id: number) {
    this.transactionLeavingSource.next(id);
  }

  updateTxData(newData: number[]) {
    this.dataSource.next(newData);
  }

}
