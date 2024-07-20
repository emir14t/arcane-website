import { Component } from '@angular/core';

@Component({
  selector: 'app-graph-simulation',
  templateUrl: './graph-simulation.component.html',
  styleUrls: ['./graph-simulation.component.scss']
})
export class GraphSimulationComponent {

}

class Node {
  private userID:number = -1;
  private parent:Node;
  private children:Array<Node> = [];
  private thresholds:Array<number> = [];
  private maxDegree:number = -1;
  constructor(parent:Node, userID:number, maxDegree:number){
    this.userID = userID;
    this.parent = parent;
    this.maxDegree = maxDegree
  }

  search_down(userID:number):boolean{
    //Base case
    if (this.children.length === 0){
      if (userID === this.userID) {return true;}
      return false;
    }

    //Iterate over the thresholds to find where the data is
    for (let index in this.thresholds){
      let threshold:number = this.thresholds[index];
      if (userID < threshold){
        return this.children[index].search_down(userID);
      }
      else if (userID === threshold){
        return true;
      }
    }
    return this.children[this.children.length-1].search_down(userID)
  }

  search_up(userID:number):boolean{
    //Base case
    if (this.parent === undefined){
      return this.search_down(userID);
    }

    //Iterate over the thresholds to find where the data could be
    for (let index in this.thresholds){
      let threshold:number = this.thresholds[index];
      if (userID < threshold){
        if (index === "0"){
          return this.parent.search_up(userID);
        }
        return this.children[index].search_down(userID);
      }
      else if (userID === threshold){
        return true;
      }
    }
    return this.parent.search_up(userID);
  }

  
}

