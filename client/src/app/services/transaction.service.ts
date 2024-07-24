import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor() { }

  private transactionArrivingSource = new Subject<any>();
  private transactionLeavingSource = new Subject<any>();

  transactionArriving$ = this.transactionArrivingSource.asObservable();
  transactionLeaving$ = this.transactionLeavingSource.asObservable();

  transactionIsArriving(node: any) {
    this.transactionArrivingSource.next(node);
  }

  transactionIsLeaving(node: any) {
    this.transactionLeavingSource.next(node);
  }

}
