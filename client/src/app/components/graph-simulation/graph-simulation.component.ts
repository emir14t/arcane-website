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
  //Signals
  parent_changed(newParent:Node){

  }

  private parent:Nullable<Node>;
  private children:Array<Node> = [];
  private thresholds:Array<Key> = new Array<Key>();
  private datas:Array<Data> = new Array<Data>();
  private maxDegree:number = -1;

  constructor(parent:Nullable<Node>, maxDegree:number){
    // Assuming that maxDegree is >= 2
    this.parent = parent;
    this.maxDegree = maxDegree;
  }


  delete_wrapper(userID:number):void{

  }

  search_down(userID:number):Nullable<Data>{
    //Base case (leaf)
    if (this.children.length === 0){
      for (let index:number = 0; index < this.thresholds.length; index++){
        if (userID === this.thresholds[index]){return this.datas[index];}
      }
      return undefined;
    }

    //Iterate over the thresholds to find where the data is
    for (let index : number = 0; index < this.thresholds.length; index ++){
      let threshold:Key = this.thresholds[index];
      if (userID < threshold){
        return this.children[index].search_down(userID);
      }
      else if (userID === threshold){
        return this.datas[index];
      }
    }
    return this.children[this.children.length-1].search_down(userID)
  }

  search_up(userID:number):Nullable<Data>{
    //Base case (root)
    if (this.parent === undefined){
      return this.search_down(userID);
    }

    //Iterate over the thresholds to find where the data could be
    for (let index : number = 0; index < this.thresholds.length; index ++){
      let threshold:Key = this.thresholds[index];

      if (userID < threshold){
        if (index === 0){
          return this.parent.search_up(userID);
        }
        return this.children[index].search_down(userID);
      }
      else if (userID === threshold){
        return this.datas[index];
      }
    }
    return this.parent.search_up(userID);
  }

  insert_child_down(userID:Key, data:Data):void{
    //Base case (leaf)
    if (this.children.length === 0){
      return this.add_data_to_node(userID, data);
    }

    //Iterate over the thresholds to find where the data is
    for (let index : number = 0; index < this.thresholds.length; index ++){
      let threshold:Key = this.thresholds[index];
      if (userID < threshold){
        return this.children[index].insert_child_down(userID, data);
      }
      else if (userID === threshold){
        throw new Error("Cannot add same user twice to the tree");
      }
    }
    return this.children[this.children.length-1].insert_child_down(userID, data)
  }

  insert_child_up(userID:Key, data:Data):void{
    //Base case (root)
    if (this.parent === undefined){
      return this.insert_child_down(userID, data);
    }

    //Iterate over the thresholds to find where the data could be
    for (let index : number = 0; index < this.thresholds.length; index ++){
      let threshold:Key = this.thresholds[index];

      if (userID < threshold){
        if (index === 0){
          return this.parent.insert_child_up(userID, data);
        }
        return this.children[index].insert_child_down(userID, data);
      }
      else if (userID === threshold){
        throw new Error("Cannot add same user twice to the tree");
      }
    }
    return this.parent.insert_child_up(userID, data);
  }

  add_data_to_node(userID:Key, data:Data):void{
    //Assuming that the userID doesn't exist in the array
    //Add to arrays
    if (this.thresholds.length == 0){
      this.thresholds.push(userID);
      this.datas.push(data);
    }
    else if (userID < this.thresholds[0]){
      this.thresholds.unshift(userID);
      this.datas.unshift(data)
    }
    else if (userID > this.thresholds[this.thresholds.length - 1]){
      this.thresholds.push(userID);
      this.datas.push(data);
    }
    else{
      //Technically can change to bin search but not my problem
      for (let i = 0; i < this.thresholds.length - 1; i++){
        if (userID < this.thresholds[i+1] && userID > this.thresholds[i]){
          this.thresholds.splice(i+1, 0, userID);
          this.datas.splice(i+1, 0, data);
        }
      }
    }

    //Check if we have to split
    if (this.thresholds.length > this.maxDegree){
      return this.split_node_wrapper();
    }
  }

  split_node_wrapper():void{
    //This handles the edge cases before asking parent to split this node
    if (parent === undefined){
      let tmpParent:Node = new Node(undefined, this.maxDegree);
      tmpParent.children.push(this);
      this.parent = tmpParent;
      this.parent_changed(tmpParent)
      return tmpParent.split_node(this);
    }

    let p:Node = this.parent as Node;
    return p.split_node(this);
  }

  split_node(childNode:Node):void{
    //Assuming that childNode.parent === this
    let newNode:Node = new Node(this, this.maxDegree);
    let sizePartition1:number = Math.floor(this.datas.length/2);
    let keyToPromote:Key = childNode.thresholds[sizePartition1];
    let dataToPromote:Data = childNode.datas[sizePartition1];

    //Spliting the node into three, the original childNode pointer, the new newNode pointer and the new promoted data
    newNode.datas = childNode.datas.slice(0, sizePartition1);
    newNode.thresholds = childNode.thresholds.slice(0, sizePartition1);
    newNode.children = childNode.children.slice(0, sizePartition1 + 1);
    for (let child of newNode.children){
      child.parent = newNode;
    }

    childNode.datas = childNode.datas.slice(sizePartition1 + 1);
    childNode.thresholds = childNode.thresholds.slice(sizePartition1 + 1);
    childNode.children = childNode.children.slice(sizePartition1 + 1);

    //Add the information to the tree
    if (this.thresholds.length == 0){
      if (this.children.length != 1){
        throw new Error("Current node has no children nor thresholds");
      }
      if (this.children[0] !== childNode){
        throw new Error("Inconsistencies when adding nodes (children doesn't represent child)");
      }
      this.children.unshift(newNode);
      this.thresholds.unshift(keyToPromote);
      this.datas.unshift(dataToPromote);
    }
    else if (keyToPromote < this.thresholds[0]){
      if (this.children[0] !== childNode){
        throw new Error("Inconsistencies when adding nodes (children doesn't represent child)");
      }
      this.children.unshift(newNode);
      this.thresholds.unshift(keyToPromote);
      this.datas.unshift(dataToPromote);
    }
    else if (keyToPromote > this.thresholds[this.thresholds.length - 1]){
      this.children.splice(this.children.length - 1, 0, newNode);
      this.thresholds.push(keyToPromote);
      this.datas.push(dataToPromote);
    }
    else if (keyToPromote === this.thresholds[this.thresholds.length - 1]){
      throw new Error("Promoted node already exists in his parent's dataset");
    }
    else{
      for (let i:number = 0; i < this.thresholds.length - 1; i++){
        if (keyToPromote > this.thresholds[i] && keyToPromote < this.thresholds[i+1]){
          this.children.splice(i+1, 0, newNode);
          this.thresholds.splice(i+1, 0, keyToPromote);
          this.datas.splice(i+1, 0, dataToPromote);
        }
        if (keyToPromote == this.thresholds[i]){
          throw new Error("Promoted node already exists in his parent's dataset");
        }
      }
    }

    //Check if we have to split
    if (this.thresholds.length > this.maxDegree){
      return this.split_node_wrapper();
    }
  }

  delete_down(userID:number):boolean{
    //Base case (leaf)
    if (this.children.length === 0){
      for (let index:number = 0; index < this.thresholds.length; index++){
        if (userID === this.thresholds[index]){
          this.delete_wrapper(userID);
          return true;
        }
      }
      return false;
    }

    //Iterate over the thresholds to find where the data is
    for (let index : number = 0; index < this.thresholds.length; index ++){
      let threshold:Key = this.thresholds[index];
      if (userID < threshold){
        return this.children[index].delete_down(userID);
      }
      else if (userID === threshold){
        this.delete_wrapper(userID);
        return true;
      }
    }
    return this.children[this.children.length-1].delete_down(userID)
  }

  delete_up(userID:number):boolean{
    //Base case (root)
    if (this.parent === undefined){
      return this.delete_down(userID);
    }

    //Iterate over the thresholds to find where the data could be
    for (let index : number = 0; index < this.thresholds.length; index ++){
      let threshold:Key = this.thresholds[index];

      if (userID < threshold){
        if (index === 0){
          return this.parent.delete_up(userID);
        }
        return this.children[index].delete_down(userID);
      }
      else if (userID === threshold){
        this.delete_wrapper(userID);
        return true;
      }
    }
    return this.parent.delete_up(userID);
  }

  validate_self():void{
    //Validate lengths
    if (this.datas.length !== this.thresholds.length){
      throw new Error("Datas and Threshold lengths are inconsistent");
    }
    if (this.children.length !== 0 && this.datas.length !== (this.children.length - 1)){
      throw new Error("Children lengths are inconsistent");
    }

    //Validate ordering
    for (let i:number = 0; i < this.thresholds.length - 1; i++){
      if (this.thresholds[i] >= this.thresholds[i+1]){
        throw new Error("Threshold orderings are wrong");
      }
    }
  }

  validate_up():void{
    if (parent !== undefined){
      let p:Node = this.parent as Node
      return p.validate_up()
    }

    this.validate_down();
  }

  validate_down():void{
    this.validate_self();
    for (let child of this.children){
      if (child.parent === undefined){
        throw new Error("Root's children's parent is unitialized");
      }

      let cp:Node = child.parent as Node;
      if (cp !== this){
        throw new Error("Root's children are not correctly representing the root as parent");
      }

      child.validate_down();
    }
  }
}



