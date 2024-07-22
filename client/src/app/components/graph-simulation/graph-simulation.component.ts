// import { Component } from '@angular/core';
// import { InjectSetupWrapper } from '@angular/core/testing';
// import { merge } from 'rxjs';


// @Component({
//   selector: 'app-graph-simulation',
//   templateUrl: './graph-simulation.component.html',
//   styleUrls: ['./graph-simulation.component.scss']
// })
// export class GraphSimulationComponent {

// }
type Key = number;
type Data = string;
type Nullable<K> = undefined | K;

class BNode {
  //Signals
  parent_changed(newParent:BNode){

  }

  private parent:Nullable<BNode>;
  private children:Array<BNode> = [];
  private thresholds:Array<Key> = new Array<Key>();
  private datas:Array<Data> = new Array<Data>();
  private maxDegree:number = -1;

  constructor(parent:Nullable<BNode>, maxDegree:number){
    //Initialization
    if (maxDegree < 2){throw new Error("Disallowed initialization");}

    this.parent = parent;
    this.maxDegree = maxDegree;
  }


  // Search algorithm
  search(userID:Key):Nullable<Data>{
    return this._search_up(userID);
  }
  _search_down(userID:Key):Nullable<Data>{
    //Base case (leaf)
    if (this.children.length === 0){
      for (let index:number = 0; index < this.thresholds.length; index++){
        if (userID === this.thresholds[index]){return this.datas[index];}
      }
      return undefined;
    }

    //Iterate over the thresholds to find where the data is
    for (let index:number = 0; index < this.thresholds.length; index++){
      let threshold:Key = this.thresholds[index];
      if (userID < threshold){
        return this.children[index]._search_down(userID);
      }
      else if (userID === threshold){
        return this.datas[index];
      }
    }
    return this.children[this.children.length-1]._search_down(userID)
  }
  _search_up(userID:Key):Nullable<Data>{
    //Base case (root)
    if (typeof this.parent === "undefined"){
      return this._search_down(userID);
    }

    //Iterate over the thresholds to find where the data could be
    for (let index:number = 0; index < this.thresholds.length; index++){
      let threshold:Key = this.thresholds[index];

      if (userID < threshold){
        if (index === 0){
          return this.parent._search_up(userID);
        }
        if (this.children.length === 0){
          return this._search_down(userID);
        }
        return this.children[index]._search_down(userID);
      }
      else if (userID === threshold){
        return this.datas[index];
      }
    }
    return this.parent._search_up(userID);
  }

  // Insertion algorithm
  insert_child(userID:Key, data:Data):void{
    return this._insert_child_up(userID, data);
  }
  _insert_child_down(userID:Key, data:Data):void{
    //Base case (leaf)
    if (this.children.length === 0){
      return this._add_data_to_node(userID, data);
    }

    //Iterate over the thresholds to find where the data is
    for (let index : number = 0; index < this.thresholds.length; index ++){
      let threshold:Key = this.thresholds[index];
      if (userID < threshold){
        return this.children[index]._insert_child_down(userID, data);
      }
      else if (userID === threshold){
        throw new Error("Cannot add same user twice to the tree");
      }
    }
    return this.children[this.children.length-1]._insert_child_down(userID, data)
  }
  _insert_child_up(userID:Key, data:Data):void{
    //Base case (root)
    if (typeof this.parent === "undefined"){
      return this._insert_child_down(userID, data);
    }

    //Iterate over the thresholds to find where the data could be
    for (let index : number = 0; index < this.thresholds.length; index ++){
      let threshold:Key = this.thresholds[index];

      if (userID < threshold){
        if (index === 0){
          return this.parent._insert_child_up(userID, data);
        }
        if (this.children.length === 0){
          return this._add_data_to_node(userID, data);
        }
        return this.children[index]._insert_child_down(userID, data);
      }
      else if (userID === threshold){
        throw new Error("Cannot add same user twice to the tree");
      }
    }
    return this.parent._insert_child_up(userID, data);
  }
  _add_data_to_node(userID:Key, data:Data):void{
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
      return this._split_node_wrapper();
    }
  }
  _split_node_wrapper():void{
    //This handles the edge cases before asking parent to split this BNode
    if (typeof this.parent === "undefined"){
      let tmpParent:BNode = new BNode(undefined, this.maxDegree);
      tmpParent.children.push(this);
      this.parent = tmpParent;
      this.parent_changed(tmpParent);
      return tmpParent._split_node(this);
    }

    return (this.parent as BNode)._split_node(this);
  }
  _split_node(childBNode:BNode):void{
    //Assuming that childBNode.parent === this
    let newBNode:BNode = new BNode(this, this.maxDegree);
    let sizePartition1:number = Math.floor(childBNode.thresholds.length/2);
    let keyToPromote:Key = childBNode.thresholds[sizePartition1];
    let dataToPromote:Data = childBNode.datas[sizePartition1];

    //Spliting the BNode into three, the original childBNode pointer, the new newBNode pointer and the new promoted data
    newBNode.datas = childBNode.datas.slice(0, sizePartition1);
    newBNode.thresholds = childBNode.thresholds.slice(0, sizePartition1);
    newBNode.children = childBNode.children.slice(0, sizePartition1 + 1);
    for (let child of newBNode.children){
      child.parent = newBNode;
    }

    childBNode.datas = childBNode.datas.slice(sizePartition1 + 1);
    childBNode.thresholds = childBNode.thresholds.slice(sizePartition1 + 1);
    childBNode.children = childBNode.children.slice(sizePartition1 + 1);

    //Add the information to the tree
    //Newly added parents
    if (this.thresholds.length == 0){
      if (this.children.length != 1){
        throw new Error("Current BNode has no children nor thresholds");
      }
      if (this.children[0] !== childBNode){
        throw new Error("Inconsistencies when adding BNodes (children doesn't represent child)");
      }

      this.children.unshift(newBNode);
      this.thresholds.unshift(keyToPromote);
      this.datas.unshift(dataToPromote);
    }
    //Finding the spot to add it
    else if (keyToPromote < this.thresholds[0]){
      if (this.children[0] !== childBNode){
        throw new Error("Inconsistencies when adding BNodes (children doesn't represent child)");
      }
      this.children.unshift(newBNode);
      this.thresholds.unshift(keyToPromote);
      this.datas.unshift(dataToPromote);
    }
    else if (keyToPromote > this.thresholds[this.thresholds.length - 1]){
      this.children.splice(this.children.length - 1, 0, newBNode);
      this.thresholds.push(keyToPromote);
      this.datas.push(dataToPromote);
    }
    else if (keyToPromote === this.thresholds[this.thresholds.length - 1]){
      throw new Error("Promoted BNode already exists in his parent's dataset. Node data:\'" + this.thresholds + "\', keyToPromote:" + keyToPromote);
    }
    else{
      for (let i:number = 0; i < this.thresholds.length - 1; i++){
        if (keyToPromote > this.thresholds[i] && keyToPromote < this.thresholds[i+1]){
          this.children.splice(i+1, 0, newBNode);
          this.thresholds.splice(i+1, 0, keyToPromote);
          this.datas.splice(i+1, 0, dataToPromote);
          break;
        }
        else if (keyToPromote == this.thresholds[i]){
          throw new Error("Promoted BNode already exists in his parent's dataset. Node data:\'" + this.thresholds + "\', keyToPromote:" + keyToPromote);
        }
      }
    }

    //Check if we have to split
    if (this.thresholds.length > this.maxDegree){
      return this._split_node_wrapper();
    }
  }

  // Deletion algorithm
  delete(userID:Key):boolean{
    return this._delete_up(userID);
  }
  _delete_down(userID:Key):boolean{
    //Base case (leaf)
    if (this.children.length === 0){
      for (let index:number = 0; index < this.thresholds.length; index++){
        if (userID === this.thresholds[index]){
          this._delete_wrapper(userID, index);
          return true;
        }
      }
      return false;
    }

    //Iterate over the thresholds to find where the data is
    for (let index : number = 0; index < this.thresholds.length; index ++){
      let threshold:Key = this.thresholds[index];
      if (userID < threshold){
        return this.children[index]._delete_down(userID);
      }
      else if (userID === threshold){
        this._delete_wrapper(userID, index);
        return true;
      }
    }
    return this.children[this.children.length-1]._delete_down(userID)
  }
  _delete_up(userID:Key):boolean{
    //Base case (root)
    if (typeof this.parent === "undefined"){
      return this._delete_down(userID);
    }

    //Iterate over the thresholds to find where the data could be
    for (let index : number = 0; index < this.thresholds.length; index ++){
      let threshold:Key = this.thresholds[index];

      if (userID < threshold){
        if (index === 0){
          return this.parent._delete_up(userID);
        }
        if (this.children.length === 0){
          return false;
        }
        return this.children[index]._delete_down(userID);
      }
      else if (userID === threshold){
        this._delete_wrapper(userID, index);
        return true;
      }
    }
    return this.parent._delete_up(userID);
  }
  _delete_wrapper(userID:Key, index:number):void{
    //Assuming that userID is present in this.children
    //Assuming that children[index] == userID
    //Case 1: Leaf
    if (this.children.length === 0){
      this.datas.splice(index, 1);
      this.thresholds.splice(index, 1);

      if (this.datas.length < this.maxDegree / 2){
        if (typeof this.parent == "undefined"){
          return;
        }
        (this.parent as BNode)._balance_tree(this);
      }
      return;
    }

    let leftChild:BNode = this.children[index];
    let rightChild:BNode = this.children[index + 1];

    //Case 2: No leaf
    //Case 2.a: Compression
    if (leftChild.thresholds.length + rightChild.thresholds.length < this.maxDegree){
      this.children.splice(index + 1, 1);
      this.datas.splice(index, 1);
      this.thresholds.splice(index, 1);

      this._merge_nodes(leftChild, rightChild);

      if (this.datas.length < this.maxDegree / 2){
        if (typeof this.parent == "undefined"){
          return;
        }
        (this.parent as BNode)._balance_tree(this);
      }
      return;
    }
    
    //Case 2.b: Rotation
    //Case 2.ba: Left child has more entries
    if (leftChild.thresholds.length > rightChild.thresholds.length){
      let indexToRem:number = leftChild.thresholds.length - 1;
      let thresholdToRem:Key = leftChild.thresholds[indexToRem];
      let dataToRem:Data = leftChild.datas[indexToRem];

      this.children[index]._delete_wrapper(thresholdToRem, indexToRem);

      this.thresholds[index] = thresholdToRem;
      this.datas[index] = dataToRem;
      
      if (this.datas.length < this.maxDegree / 2){
        if (typeof this.parent == "undefined"){
          return;
        }
        (this.parent as BNode)._balance_tree(this);
      }
      return;
    }

    //Case 2.bb: Right child has more (or equal) entries
    else{
      let indexToRem:number = rightChild.thresholds.length - 1;
      let thresholdToRem:Key = rightChild.thresholds[indexToRem];
      let dataToRem:Data = rightChild.datas[indexToRem];

      this.children[index + 1]._delete_wrapper(thresholdToRem, indexToRem);

      this.thresholds[index] = thresholdToRem;
      this.datas[index] = dataToRem;
      
      if (this.datas.length < this.maxDegree / 2){
        if (typeof this.parent == "undefined"){
          return;
        }
        (this.parent as BNode)._balance_tree(this);
      }
      return;
    }
  }
  _merge_nodes(BNode1:BNode, BNode2:BNode){
    //Assuming that both BNodes provided are from the same level
    //Base Case: leaves
    if (BNode1.children.length == 0){
      BNode1.thresholds = BNode1.thresholds.concat(BNode2.thresholds);
      BNode1.datas = BNode1.datas.concat(BNode2.datas);
      return true;
    }

    let leftChild = BNode1.children[BNode1.children.length - 1];
    let rightChild = BNode2.children[0];

    //Case 1: We have to keep merging
    if (leftChild.thresholds.length + rightChild.thresholds.length < this.maxDegree){
      BNode1.thresholds = BNode1.thresholds.concat(BNode2.thresholds);
      BNode1.datas = BNode1.datas.concat(BNode2.datas);
      BNode2.children.shift();
      BNode1.children = BNode1.children.concat(BNode2.children);
      this._merge_nodes(leftChild, rightChild)
      return;
    }

    //Case 2: We can just rotate
    else{
      //Case 2.a: Left child has more entries
      if (leftChild.thresholds.length > rightChild.thresholds.length){
        let indexToPromote:number = leftChild.thresholds.length - 1;
        let keyToPromote:Key = leftChild.thresholds[indexToPromote];
        let dataToPromote:Data = leftChild.datas[indexToPromote];

        leftChild._delete_wrapper(keyToPromote, indexToPromote);

        BNode1.thresholds.push(keyToPromote);
        BNode1.datas.push(dataToPromote);

        BNode1.thresholds = BNode1.thresholds.concat(BNode2.thresholds);
        BNode1.datas = BNode1.datas.concat(BNode2.datas);
        BNode1.children = BNode1.children.concat(BNode2.children);
      }
  
      //Case 2.b: Right child has more (or equal) entries
      else{
        let indexToPromote:number = 0;
        let keyToPromote:Key = rightChild.thresholds[indexToPromote];
        let dataToPromote:Data = rightChild.datas[indexToPromote];

        rightChild._delete_wrapper(keyToPromote, indexToPromote);

        BNode1.thresholds.push(keyToPromote);
        BNode1.datas.push(dataToPromote);

        BNode1.thresholds = BNode1.thresholds.concat(BNode2.thresholds);
        BNode1.datas = BNode1.datas.concat(BNode2.datas);
        BNode1.children = BNode1.children.concat(BNode2.children);
      }
      return;
    }
  }
  _balance_tree(changedBNode:BNode):void{
    throw new Error("Balancing");
    let curNbBNodes : number = this.thresholds.length;
    //If the number of BNodes here are smaller than half the max amount, then we have to compress
    if (curNbBNodes <= this.maxDegree / 2){ 
    }
  }
  
  // Validation algorithm
  validate_tree():void{
    this._validate_up();
  }
  _validate_self():void{
    //Validate lengths
    if (this.datas.length !== this.thresholds.length) {throw new Error("Datas and Threshold lengths are inconsistent");}
    if (this.children.length !== 0 && this.datas.length !== (this.children.length - 1)) {throw new Error("Children lengths are inconsistent");}
    if (typeof this.parent !== "undefined" && this.datas.length < Math.floor(this.maxDegree / 2)) {throw new Error("Tree has nodes with less than the minimum amount of nodes ");}

    //Validate ordering
    for (let i:number = 0; i < this.thresholds.length - 1; i++){
      if (this.thresholds[i] >= this.thresholds[i+1]){throw new Error("Threshold orderings are wrong");}
    }
  }
  _validate_up():void{
    if (typeof this.parent === "undefined"){return this._validate_down();}

    return (this.parent as BNode)._validate_up()
  }
  _validate_down():void{
    this._validate_self();
    for (let child of this.children){
      if (typeof child.parent === "undefined")  { throw new Error("Root's children's parent is unitialized");}
      if ((child.parent as BNode) !== this)     { throw new Error("Root's children are not correctly representing the root as parent");}

      child._validate_down();
    }
  }

  // Print the tree
  print_tree():void{
    return this._print_tree_up();
  }
  _print_tree_up():void{
    if(typeof this.parent != "undefined"){
      return (this.parent as BNode)._print_tree_up();
    }

    this._print_tree_down(0);
    console.log("");
  }
  _print_tree_down(cur_level:number):void{
    if(cur_level === 0){
      console.log('// ' + this.thresholds);
    }
    else if (cur_level === 1){
      console.log(`// |${'────'.repeat(cur_level)} ${this.thresholds}`);
    }
    else{
      console.log(`// |${'    '.repeat(cur_level - 1)} |──── ${ this.thresholds}`);
    }
    
    for (let child of this.children){
      child._print_tree_down(cur_level + 1);
    }
  }
}



function insertionTest001(){
  let cur:BNode = new BNode(undefined, 5);

  for (let i = 0; i <= 100; i += 5){
    cur.insert_child(i ,"hi");
  }
  for (let i = 1; i <= 100; i += 5){
    cur.insert_child(i ,"hi");
  }
  for (let i = 2; i <= 100; i += 5){
    cur.insert_child(i ,"hi");
  }
  for (let i = 3; i <= 100; i += 5){
    cur.insert_child(i ,"hi");
  }
  for (let i = 4; i <= 100; i += 5){
    cur.insert_child(i ,"hi");
  }

  cur.print_tree();
  cur.validate_tree();
}
function insertionTest002(){
  let cur:BNode = new BNode(undefined, 5);

  for (let i = 0; i <= 100; i ++){
    cur.insert_child(i ,"hi");
  }
  
  cur.print_tree();
  cur.validate_tree();
}
function insertionTest003(){
  let cur:BNode = new BNode(undefined, 5);

  for (let i = 100; i >= 0; i --){
    cur.insert_child(i ,"hi");
  }
  
  cur.print_tree();
  cur.validate_tree();
}
function searchTest001(){
  let cur:BNode = new BNode(undefined, 5);

  for (let i = 0; i <= 100; i += 5){
    cur.insert_child(i ,"hi");
  }
  for (let i = 1; i <= 100; i += 5){
    cur.insert_child(i ,"hi");
  }
  for (let i = 2; i <= 100; i += 5){
    cur.insert_child(i ,"hi");
  }
  for (let i = 3; i <= 100; i += 5){
    cur.insert_child(i ,"hi");
  }
  for (let i = 4; i <= 100; i += 5){
    cur.insert_child(i ,"hi");
  }
  
  for (let i = 0; i <= 100; i ++){
    if (cur.search(i) !== "hi"){
      throw new Error("Problem with the search");
    }
  }
  for (let i = 101; i <= 200; i++){
    if (typeof cur.search(i) !== "undefined"){
      throw new Error("Problem with the search");
    }
  }

  console.log("Works");
}
function deleteTest001(){
  let cur:BNode = new BNode(undefined, 5);

  for (let i = 0; i <= 100; i ++){
    cur.insert_child(i ,"hi");
  }

  for (let i = 0; i <= 100; i++){
    cur.delete(i);
    cur.print_tree();
    cur.validate_tree();
  }
}

deleteTest001();