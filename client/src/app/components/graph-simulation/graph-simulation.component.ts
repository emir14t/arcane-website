import { Component } from '@angular/core';

@Component({
  selector: 'app-graph-simulation',
  templateUrl: './graph-simulation.component.html',
  styleUrls: ['./graph-simulation.component.scss']
})
export class GraphSimulationComponent {

}
type Key = number;
type Data = string;
type Nullable<K> = undefined | K;

class Node {
  private parent:Node;
  private children:Array<Node> = [];
  private thresholds:Map<Key,Data> = new Map<Key,Data>();
  private maxDegree:number = -1;
  private userID:Key = -1;
  private data:Data;

  constructor(parent:Node, userID:number, maxDegree:number, data:string){
    // Assuming that userID id is valid
    // Assuming that maxDegree is >= 2
    this.userID = userID;
    this.parent = parent;
    this.maxDegree = maxDegree;
    this.data = data;
  }

  search_down(userID:number):Nullable<Data>{
    //Base case
    if (this.children.length === 0){
      if (userID === this.userID) {return this.data;}
      return undefined;
    }

    //Iterate over the thresholds to find where the data is
    let thresholdVals = this.thresholds.keys();
    for (let index : number = 0; index < this.thresholds.size; index ++){
      let threshold:Key = thresholdVals.next().value;

      if (userID < threshold){
        return this.children[index].search_down(userID);
      }
      else if (userID === threshold){
        return this.thresholds.get(threshold);
      }
    }
    return this.children[this.children.length-1].search_down(userID)
  }

  search_up(userID:number):Nullable<Data>{
    //Base case
    if (this.parent === undefined){
      return this.search_down(userID);
    }

    //Iterate over the thresholds to find where the data could be
    let thresholdVals = this.thresholds.keys();
    for (let index : number = 0; index < this.thresholds.size; index ++){
      let threshold:Key = thresholdVals.next().value;

      if (userID < threshold){
        if (index === 0){
          return this.parent.search_up(userID);
        }
        return this.children[index].search_down(userID);
      }
      else if (userID === threshold){
        return this.thresholds.get(threshold);
      }
    }
    return this.parent.search_up(userID);
  }

  insert_child_down(user:Node):void{
    //Base case
    if (this.children.length === 0){
      return this.add_child_to_node(user);
    }

    //Iterate over the thresholds to find where the data is
    let thresholdVals = this.thresholds.keys();
    for (let index : number = 0; index < this.thresholds.size; index ++){
      let threshold:Key = thresholdVals.next().value;
      if (user.userID < threshold){
        return this.children[index].insert_child_down(user);
      }
      else if (user.userID === threshold){
        throw new Error("Cannot add same user twice to the tree");
      }
    }
    return this.children[this.children.length-1].insert_child_down(user)
  }

  insert_child_up(user:Node):void{
    //Base case
    if (this.parent === undefined){
      return this.insert_child_down(user);
    }

    //Iterate over the thresholds to find where the data could be
    let thresholdVals = this.thresholds.keys();
    for (let index : number = 0; index < this.thresholds.size; index ++){
      let threshold:Key = thresholdVals.next().value;

      if (user.userID < threshold){
        if (index === 0){
          return this.parent.insert_child_up(user);
        }
        return this.children[index].insert_child_down(user);
      }
      else if (user.userID === threshold){
        throw new Error("Cannot add same user twice to the tree");
      }
    }
    return this.parent.insert_child_up(user);
  }

  add_child_to_node(user:Node){
    
  }

  split_node():void{

  }
}



