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

let root:BNode;
class BNode {
  //Signals
  parent_changed(newParent:BNode){
    root = newParent;
    console.log("Root has changed!");
  }

  public parent:Nullable<BNode>;
  public children:Array<BNode> = [];
  public thresholds:Array<Key> = new Array<Key>();
  public datas:Array<Data> = new Array<Data>();
  public maxDegree:number = -1;

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
      let childToDeleteFrom = leftChild;
      while(childToDeleteFrom.children.length !== 0){
        childToDeleteFrom = childToDeleteFrom.children[childToDeleteFrom.children.length - 1];
      }
      let indexToRem:number = childToDeleteFrom.thresholds.length - 1;
      let thresholdToRem:Key = childToDeleteFrom.thresholds[indexToRem];
      let dataToRem:Data = childToDeleteFrom.datas[indexToRem];

      childToDeleteFrom._delete_wrapper(thresholdToRem, indexToRem);

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
      let childToDeleteFrom = rightChild;
      while(childToDeleteFrom.children.length !== 0){
        childToDeleteFrom = childToDeleteFrom.children[0];
      }
      let thresholdToRem:Key = childToDeleteFrom.thresholds[0];
      let dataToRem:Data = childToDeleteFrom.datas[0];

      childToDeleteFrom._delete_wrapper(thresholdToRem, 0);

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
    console.log("Merging");
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
      for (let child of BNode1.children){
        child.parent = BNode1;
      }
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
        for (let child of BNode1.children){
          child.parent = BNode1;
        }
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
        for (let child of BNode1.children){
          child.parent = BNode1;
        }
      }
      return;
    }
  }
  _balance_tree(changedBNode:BNode):void{
    if (changedBNode.thresholds.length >= Math.floor(this.maxDegree / 2)){
      return;
    }
    console.log("Balancing");

    //Finding the index
    let index:number = 0;
    let found:boolean = false;
    
    for (let child of this.children){
      if (child === changedBNode){
        found = true;
        break;
      }
      index++;
    }
    if (!found){
      throw new Error("Provided changedBNode doesn't exist in children list");
    }

    // See if we can compress the entire thing
    let total:number = this.thresholds.length;
    for (let child of this.children){
      total += child.thresholds.length;
    }
    if (total <= this.maxDegree){
      let iter = this.thresholds.length;
      for (let i = iter; i >= 0; i--){
        this.thresholds.splice(i, 0, ...this.children[i].thresholds);
        this.datas.splice(i, 0, ...this.children[i].datas);
      }

      let tmpChildren:Array<BNode>= this.children;
      this.children = [];
      for (let child of tmpChildren){
        this.children.push(...child.children);
      }
      for (let child of this.children){
        child.parent = this;
      }

      if ((typeof this.parent !== "undefined") && (total < (this.maxDegree / 2))){
        return (this.parent as BNode)._balance_tree(this);
      }
      return;
    }

    // Case 2: Rotate
    if (index - 1 >= 0){
      let child = this.children[index-1];
      let child2 = this.children[index];
      if (child.thresholds.length > Math.floor(this.maxDegree / 2) + 1){
        let tmpIndex = child.thresholds.length - 1;

        let tmpKey = child.thresholds[tmpIndex];
        let tmpData = child.datas[tmpIndex];
        child.thresholds.pop();
        child.datas.pop();

        if (child.children.length !== 0){
          let tmpChild = child.children[tmpIndex + 1];
          child.children.pop();
          child2.children.unshift(tmpChild);
          tmpChild.parent = child2;
        }

        let tmpKey1 = this.thresholds[index - 1];
        let tmpData1 = this.datas[index - 1];
        this.thresholds[index - 1] = tmpKey;
        this.datas[index - 1] = tmpData;

        child2.thresholds.unshift(tmpKey1);
        child2.datas.unshift(tmpData1);
        return;
      }
    }
    // If the right child exists
    if (index + 1 < this.children.length){
      let child = this.children[index+1];
      let child2 = this.children[index];
      if (child.thresholds.length > Math.floor(this.maxDegree / 2) + 1){
        let tmpKey = child.thresholds[0];
        let tmpData = child.datas[0];
        child.thresholds.shift();
        child.datas.shift();

        if (child.children.length !== 0){
          let tmpChild = child.children[0]
          child.children.shift();
          child2.children.push(tmpChild);
          tmpChild.parent = child2;
        }

        let tmpKey1 = this.thresholds[index];
        let tmpData1 = this.datas[index];
        this.thresholds[index] = tmpKey;
        this.datas[index] = tmpData;

        child2.thresholds.push(tmpKey1);
        child2.datas.push(tmpData1);
        return;
      }
    }
    
    // Case 1: Compress
    // If the left child exists
    if (index - 1 >= 0){
      if (this.children[index-1].thresholds.length + this.children[index].thresholds.length < this.maxDegree){
        let child = this.children[index - 1];
        let child2 = this.children.splice(index, 1)[0];
        let tmpKey = this.thresholds.splice(index-1, 1)[0];
        let tmpData = this.datas.splice(index-1, 1)[0];

        child.thresholds.push(tmpKey, ...child2.thresholds);
        child.datas.push(tmpData, ...child2.datas);
        child.children.push(...child2.children);

        for (let tmpChild of child.children){
          tmpChild.parent = child;
        }
        
        this._balance_tree(this.children[index-1]);
        if (typeof this.parent !== "undefined"){
          (this.parent as BNode)._balance_tree(this);
        }
        return;
      }
    }
    // If the right child exists
    if (index + 1 < this.children.length){
      if (this.children[index].thresholds.length + this.children[index+1].thresholds.length < this.maxDegree){
        let child = this.children[index];
        let child2 = this.children.splice(index+1, 1)[0];
        let tmpKey = this.thresholds.splice(index, 1)[0];
        let tmpData = this.datas.splice(index, 1)[0];

        child.thresholds.push(tmpKey, ...child2.thresholds);
        child.datas.push(tmpData, ...child2.datas);
        child.children.push(...child2.children);

        for (let tmpChild of child.children){
          tmpChild.parent = child;
        }

        this._balance_tree(this.children[index]);
        if (typeof this.parent !== "undefined"){
          (this.parent as BNode)._balance_tree(this);
        }
        return;
      }
    }
    throw new Error("Balancing failed");
  }
  
  // Validation algorithm
  validate_tree():void{
    this._validate_up();
  }
  _validate_self(minNumb:number, maxNumb:number):void{
    //Validate lengths
    if (this.datas.length !== this.thresholds.length) {throw new Error("Datas and Threshold lengths are inconsistent");}
    if (this.children.length !== 0 && this.datas.length !== (this.children.length - 1)) {throw new Error("Children lengths are inconsistent");}
    if (typeof this.parent !== "undefined" && this.datas.length < Math.floor(this.maxDegree / 2)) {throw new Error("Tree has nodes with less than the minimum amount of nodes ");}
    
    //Validate ordering
    for (let i:number = 0; i < this.thresholds.length - 1; i++){
      if (this.thresholds[i] >= this.thresholds[i+1]){throw new Error("Threshold orderings are wrong");}
    }

    //Validate order of data
    if (this.thresholds[0] < minNumb){throw new Error("Thresholds in current node do not respect the min")}
    if (this.thresholds[this.thresholds.length - 1] > maxNumb){throw new Error("Thresholds in current node do not respect the max")}
  }
  _validate_up():void{
    if (typeof this.parent === "undefined"){return this._validate_down(-Infinity, Infinity);}

    return (this.parent as BNode)._validate_up()
  }
  _validate_down(minNumb:number, maxNumb:number):void{
    this._validate_self(minNumb, maxNumb);
    for (let index = 0; index < this.children.length; index++){
      let child = this.children[index]
      if (typeof child.parent === "undefined")  { throw new Error("Children's parent is unitialized");}
      if ((child.parent as BNode) !== this)     { throw new Error("Childrens are not correctly representing their parent as parent");}

      let curMin:number = minNumb;
      let curMax:number = maxNumb;

      if (index === 0){
        curMax = this.thresholds[0];
      }
      else if (index === this.children.length - 1){
        curMin = this.thresholds[index - 1];
      }
      else{
        curMin = this.thresholds[index - 1];
        curMax = this.thresholds[index];
      }

      child._validate_down(curMin, curMax);
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


function insertionTests(){
  insertionTest001();
  insertionTest002();
  insertionTest003();

  console.log("Works");
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

  cur.validate_tree();
}
function insertionTest002(){
  let cur:BNode = new BNode(undefined, 5);

  for (let i = 0; i <= 100; i ++){
    cur.insert_child(i ,"hi");
  }
  
  cur.validate_tree();
}
function insertionTest003(){
  let cur:BNode = new BNode(undefined, 6);

  for (let i = 100; i >= 0; i --){
    cur.insert_child(i ,"hi");
  }
  
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

  for (let i = 0; i <= 1000; i ++){
    cur.insert_child(i ,"hi");
  }

  cur.print_tree();
  cur.validate_tree();

  for (let i = 0; i <= 1000; i++){
    if(root.delete(i) !== true){
      throw new Error("Deletion didn't delete");
    }
    // root.print_tree();
    root.validate_tree();
  }
}
function deleteTest002(){
  let cur:BNode = new BNode(undefined, 5);
  let leap = 5;
  let max = 1000;
  for (let j = 0; j < leap; j++){
    for (let i = j; i <= max; i += leap){
      cur.insert_child(i ,"hi");
    }
  }


  cur.validate_tree();
  for (let j = 0; j < leap; j++){
    for (let i = j; i <= max; i += leap){
      console.log("Deleting " + i);
      if(root.delete(i) !== true){
        cur.print_tree();
        throw new Error("Deletion didn't delete");
      }
      cur.print_tree();
      root.validate_tree();
    }
  }

  console.log("All Good");
}


function validationTests(){
  if (!validationTest001()){throw new Error("Doesn't work 001")}
  if (!validationTest002()){throw new Error("Doesn't work 002")}
  if (!validationTest003()){throw new Error("Doesn't work 003")}
  if (!validationTest004()){throw new Error("Doesn't work 004")}

  console.log("Works");
}
function validationTest001(){
  let n:BNode = new BNode(undefined, 5);
  n.children = [new BNode(n, 5),new BNode(n, 5),new BNode(n, 5),new BNode(n, 5),new BNode(n, 5)];
  try{
    n.validate_tree()
  }
  catch(e){
    return true;
  }
  return false;
}
function validationTest002(){
  let n:BNode = new BNode(undefined, 5);
  let n1:BNode = new BNode(undefined, 5);
  n.children = [new BNode(n1, 5),new BNode(n, 5),new BNode(n, 5),new BNode(n, 5),new BNode(n, 5)];
  n.thresholds = [1,5,8,10]
  n.datas = ["hi","hi","hi","hi"]
  try{
    n.validate_tree()
  }
  catch(e){
    return true;
  }
  return false;
}
function validationTest003(){
  let n:BNode = new BNode(undefined, 5);
  n.children = [new BNode(n, 5),new BNode(n, 5),new BNode(n, 5),new BNode(n, 5),new BNode(n, 5)];
  n.thresholds = [1,5,8,10]
  n.datas = ["hi","hi","hi","hi"]
  try{
    n.validate_tree()
  }
  catch(e){
    return true;
  }
  return false;
}
function validationTest004(){
  let n:BNode = new BNode(undefined, 2);
  let n1:BNode = new BNode(n, 2);
  let n2:BNode = new BNode(n, 2);
  let n11:BNode = new BNode(n1, 2);
  let n12:BNode = new BNode(n1, 2);
  let n21:BNode = new BNode(n2, 2);
  let n22:BNode = new BNode(n2, 2);

  n.children = [n1,n2]
  n1.children = [n11,n12]
  n2.children = [n21,n22]

  n.thresholds = [10]
  n.datas = ["hi"]
  n1.thresholds = [5]
  n1.datas = ["hi"]
  n2.thresholds = [16]
  n2.datas = ["hi"]
  n11.thresholds = [2]
  n11.datas = ["hi"]
  n12.thresholds = [6]
  n12.datas = ["hi"]
  n21.thresholds = [12]
  n21.datas = ["hi"]
  n22.thresholds = [18]
  n22.datas = ["hi"]

  try{
    n.validate_tree()
  }
  catch(e){
    console.log(e)
    return false;
  }
  return true;
}

deleteTest002();