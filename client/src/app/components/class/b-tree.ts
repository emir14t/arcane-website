import { Node,Transaction } from "src/app/interface/interface";
import { Mutex } from 'async-mutex';
import { BUBBLE_UP_WAIT_TIME,TRANSACTION_WAIT_TIME } from "src/app/constants"; 

type Key = number;
type Nullable<K> = undefined | K;

function process_transactions(transactions:Array<Transaction>){
  console.log("Transaction Arrived");
  let output:Array<String> = [];
  for (let i = 0; i < transactions.length; i++){
    output.push(transactions[i].writes.keys().next().value)
  }
  console.log("--->" + output.join(' '));
  console.log();
}
//Use that map that you conveniently have, you fucking shithead to convert nodes to its ID
function transaction_is_arriving(node:BNode<any>){

}
function transaction_is_leaving(node:BNode<any>){

}

export class BNode<Data> {
  //Signals
  parent_changed(newParent:BNode<Data>){
    //console.log("Root has changed!");
  }
  
  // Data
  private parent:Nullable<BNode<Data>>;
  private children:Array<BNode<Data>> = [];
  private thresholds:Array<Key> = new Array<Key>();
  private datas:Array<Data> = new Array<Data>();
  private maxDegree:number = -1;

  // Constructor
  constructor(parent:Nullable<BNode<Data>>, maxDegree:number){
    //Initialization
    if (maxDegree < 2){throw new Error("Disallowed initialization");}

    this.parent = parent;
    this.maxDegree = maxDegree;
  }

  // Transactions
  private my_lock = new Mutex();
  private all_cur_transactions:Array<Transaction> = []
  async create_transaction(transaction:Transaction){
    this._data_collection([transaction]);
  }
  // Called whenever a node receives a transaction
  private async _data_collection(transactions:Array<Transaction>):Promise<void>{
    transaction_is_arriving(this);
    await this.my_lock.acquire();
    try{
      let im_collecting = (this.all_cur_transactions.length === 0);
      this.all_cur_transactions.push(...transactions);
      if (im_collecting){
        setTimeout(this._bubble_up.bind(this), BUBBLE_UP_WAIT_TIME)
      }
    }
    finally{
      this.my_lock.release();
    }
  }
  // Called whenever a node bubbles up a transaction
  private async _bubble_up(){
    transaction_is_leaving(this);
    await this.my_lock.acquire();
    try{
      if (typeof this.parent === "undefined"){
        setTimeout(process_transactions.bind(this), TRANSACTION_WAIT_TIME, this.all_cur_transactions);
      }
      else{
        setTimeout((this.parent as BNode<Data>)._data_collection.bind(this), TRANSACTION_WAIT_TIME, this.all_cur_transactions);
      }

      this.all_cur_transactions = []; 
    }
    finally{
      this.my_lock.release();
    }
  }

  // Search algorithm (returns the Data associated with the userID if it exists and undefined if the userID doesn't exist)
  search(userID:Key):Nullable<Data>{
    return this._search_up(userID);
  }
  private _search_down(userID:Key):Nullable<Data>{
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
  private _search_up(userID:Key):Nullable<Data>{
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

  // Insertion algorithm (returns a BNode<Data> that contains the user you added)
  insert_child(userID:Key, data:Data):BNode<Data>{
    return this._insert_child_up(userID, data);
  }
  private _insert_child_down(userID:Key, data:Data):BNode<Data>{
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
  private _insert_child_up(userID:Key, data:Data):BNode<Data>{
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
  private _add_data_to_node(userID:Key, data:Data):BNode<Data>{
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
      if (!this.thresholds.includes(userID)){
        throw new Error("Threshold doesn't show that we've added the user");
      }
      return (this._split_node_wrapper(userID) as BNode<Data>);
    }
    return this;
  }
  private _split_node_wrapper(userID:Key):(BNode<Data>|undefined){
    //This handles the edge cases before asking parent to split this BNode
    if (typeof this.parent === "undefined"){
      let tmpParent:BNode<Data> = new BNode(undefined, this.maxDegree);
      tmpParent.children.push(this);
      this.parent = tmpParent;
      this.parent_changed(tmpParent);
      return tmpParent._split_node(userID, this);
    }

    return (this.parent as BNode<Data>)._split_node(userID, this);
  }
  private _split_node(userID:Key, childBNode:BNode<Data>):(BNode<Data>|undefined){
    //Assuming that childBNode.parent === this
    let newBNode:BNode<Data> = new BNode<Data>(this, this.maxDegree);
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
      let ans:(BNode<Data> | undefined) = this._split_node_wrapper(userID);
      if (newBNode.thresholds.includes(userID)){
        return newBNode;
      }
      else if (childBNode.thresholds.includes(userID)){
        return childBNode;
      }
      else{
        return ans;
      }
    }
    else{
      if (keyToPromote === userID){
        return this;
      }
      else if (newBNode.thresholds.includes(userID)){
        return newBNode;
      }
      else if (childBNode.thresholds.includes(userID)){
        return childBNode;
      }
      else{
        return undefined;
      }
    }
  }

  // Deletion algorithm (returns a valid BNode<Data>)
  delete(userID:Key):BNode<Data>{
    return this._delete_up(userID);
  }
  private _delete_down(userID:Key):BNode<Data>{
    //Base case (leaf)
    if (this.children.length === 0){
      for (let index:number = 0; index < this.thresholds.length; index++){
        if (userID === this.thresholds[index]){
          return this._delete_wrapper(userID, index);
        }
      }
      throw new Error("Node not found")
    }

    //Iterate over the thresholds to find where the data is
    for (let index : number = 0; index < this.thresholds.length; index ++){
      let threshold:Key = this.thresholds[index];
      if (userID < threshold){
        return this.children[index]._delete_down(userID);
      }
      else if (userID === threshold){
        return this._delete_wrapper(userID, index);
      }
    }
    return this.children[this.children.length-1]._delete_down(userID)
  }
  private _delete_up(userID:Key):BNode<Data>{
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
          throw new Error("Node not found")
        }
        return this.children[index]._delete_down(userID);
      }
      else if (userID === threshold){
        return this._delete_wrapper(userID, index);
      }
    }
    return this.parent._delete_up(userID);
  }
  private _delete_wrapper(userID:Key, index:number):BNode<Data>{
    //Assuming that userID is present in this.children
    //Assuming that children[index] == userID
    //Case 1: Leaf
    if (this.children.length === 0){
      this.datas.splice(index, 1);
      this.thresholds.splice(index, 1);

      if (this.datas.length < this.maxDegree / 2){
        if (typeof this.parent == "undefined"){
          return this;
        }
        return (this.parent as BNode<Data>)._balance_tree(this);
      }
      return this;
    }

    let leftChild:BNode<Data> = this.children[index];
    let rightChild:BNode<Data> = this.children[index + 1];

    //Case 2: No leaf
    //Case 2.a: Compression
    if (leftChild.thresholds.length + rightChild.thresholds.length < this.maxDegree){
      this.children.splice(index + 1, 1);
      this.datas.splice(index, 1);
      this.thresholds.splice(index, 1);

      this._merge_nodes(leftChild, rightChild);

      if (this.datas.length < this.maxDegree / 2){
        if (typeof this.parent == "undefined"){
          return this;
        }
        return (this.parent as BNode<Data>)._balance_tree(this);
      }
      return this;
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
          return this;
        }
        return (this.parent as BNode<Data>)._balance_tree(this);
      }
      return this;
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
          return this;
        }
        return (this.parent as BNode<Data>)._balance_tree(this);
      }
      return this;
    }
  }
  private _merge_nodes(BNode1:BNode<Data>, BNode2:BNode<Data>):void{
    //Assuming that both BNodes provided are from the same level
    //Base Case: leaves
    if (BNode1.children.length == 0){
      BNode1.thresholds = BNode1.thresholds.concat(BNode2.thresholds);
      BNode1.datas = BNode1.datas.concat(BNode2.datas);
      return;
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
  private _balance_tree(changedBNode:BNode<Data>):BNode<Data>{
    if (changedBNode.thresholds.length >= Math.floor(this.maxDegree / 2)){
      return this;
    }

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

      let tmpChildren:Array<BNode<Data>> = this.children;
      this.children = [];
      for (let child of tmpChildren){
        this.children.push(...child.children);
      }
      for (let child of this.children){
        child.parent = this;
      }

      if ((typeof this.parent !== "undefined") && (total < (this.maxDegree / 2))){
        return (this.parent as BNode<Data>)._balance_tree(this);
      }
      return this;
    }

    // Case 2: Rotate
    // If left child exists
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
        return this;
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
        return this;
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
          return (this.parent as BNode<Data>)._balance_tree(this);
        }
        return this;
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
          return (this.parent as BNode<Data>)._balance_tree(this);
        }
        return this;
      }
    }
    throw new Error("Balancing failed");
  }
  
  // Validation algorithm (checks the integrety of the BTree)
  validate_tree():void{
    this._validate_up();
  }
  private _validate_self(minNumb:number, maxNumb:number):void{
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
  private _validate_up():void{
    if (typeof this.parent === "undefined"){return this._validate_down(-Infinity, Infinity);}

    return (this.parent as BNode<Data>)._validate_up()
  }
  private _validate_down(minNumb:number, maxNumb:number):void{
    this._validate_self(minNumb, maxNumb);
    for (let index = 0; index < this.children.length; index++){
      let child = this.children[index]
      if (typeof child.parent === "undefined")  { throw new Error("Children's parent is unitialized");}
      if ((child.parent as BNode<Data>) !== this)     { throw new Error("Childrens are not correctly representing their parent as parent");}

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
  private _print_tree_up():void{
    if(typeof this.parent != "undefined"){
      return (this.parent as BNode<Data>)._print_tree_up();
    }

    this._print_tree_down(0);
    console.log("");
  }
  private _print_tree_down(cur_level:number):void{
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

  // BNode tree to Map (converts a BNode tree to a map)
  bnode_tree_to_node_map():Map<number, Node>{
    if (typeof this.parent === "undefined"){
      return this._bnode_tree_to_node_map_down(this);
    }
    return (this.parent as BNode<Data>).bnode_tree_to_node_map();
  }
  private _bnode_tree_to_node_map_down(root:BNode<any>):Map<number, Node>{
    let queue1:Array<BNode<any>> = [root];
    let queue2:Array<BNode<any>> = [];
    let turnstile = true;
  
    let depth = 0;
    let breadth = 0;
    let curID = 1;
  
    let retMap:Map<number, Node> = new Map();
    let helpMap:Map<Key, number> = new Map();
    helpMap.set(root.thresholds[0], 0)
  
    while(queue1.length !== 0 || queue2.length !== 0){
      if (turnstile){
        for (let i = 0; i < queue1.length; i++){
          let node = queue1[i];
          let children = []
          for (let child of node.children){
            helpMap.set(child.thresholds[0], curID);
            children.push(curID);
            queue2.push(child);
            curID++;
          }
          
          let id:number = (helpMap.get(node.thresholds[0]) as number);
          let parent:null|number = typeof node.parent === "undefined" ? null : (helpMap.get(node.parent.thresholds[0]) as number);
          retMap.set(id, {id:id, value:node.thresholds.toString(), depth:depth, breadth:breadth, parent:parent});
          breadth++;
        }
        queue1 = []
      }
      else{
        for (let i = 0; i < queue2.length; i++){
          let node = queue2[i];
          let children = []
          for (let child of node.children){
            helpMap.set(child.thresholds[0], curID);
            children.push(curID);
            queue1.push(child);
            curID++;
          }
          
          let id:number = (helpMap.get(node.thresholds[0]) as number);
          let parent:null|number = typeof node.parent === "undefined" ? null : (helpMap.get(node.parent.thresholds[0]) as number);
          retMap.set(id, {id:id, value:node.thresholds.toString(), depth:depth, breadth:breadth, parent:parent});
          breadth++;
        }
        queue2 = []
      }
      depth ++;
      breadth = 0;
      turnstile = !turnstile;
    }
  
    return retMap;
  }
  
  // Has (used for tests)
  has(userID:Key){
    return this.thresholds.includes(userID);
  }
}


export class Testing{
  allTests(){
    this.insertionTest001();
    this.insertionTest002();
    this.insertionTest003();
    this.insertionTest004();
    this.searchTest001();
    this.deleteTest001();
    this.deleteTest002();
    this.deleteTest003();

    console.log("Works");
  }

  insertionTest001(){
    let cur:BNode<Array<string>> = new BNode(undefined, 5);

    for (let i = 0; i <= 100; i += 5){
      cur = cur.insert_child(i ,["hi"]);
    }
    for (let i = 1; i <= 100; i += 5){
      cur = cur.insert_child(i ,["hi"]);
    }
    for (let i = 2; i <= 100; i += 5){
      cur = cur.insert_child(i ,["hi"]);
    }
    for (let i = 3; i <= 100; i += 5){
      cur = cur.insert_child(i ,["hi"]);
    }
    for (let i = 4; i <= 100; i += 5){
      cur = cur.insert_child(i ,["hi"]);
    }

    cur.validate_tree();
  }
  insertionTest002(){
    let cur:BNode<Array<string>> = new BNode(undefined, 5);

    for (let i = 0; i <= 100; i ++){
      cur = cur.insert_child(i ,["hi"]);
    }
    
    cur.validate_tree();
  }
  insertionTest003(){
    let cur:BNode<Array<string>> = new BNode(undefined, 6);

    for (let i = 100; i >= 0; i --){
      cur = cur.insert_child(i ,["hi"]);
    }
    
    cur.validate_tree();
  }
  insertionTest004(){
    let cur:BNode<Array<string>> = new BNode(undefined, 5);

    for (let i = 0; i <= 100; i ++){
      cur = cur.insert_child(i ,["hi"]);
      if (!cur.has(i)){
        throw new Error("Output isnt correct");
      }
    }
  }

  searchTest001(){
    let cur:BNode<Array<string>> = new BNode(undefined, 5);

    for (let i = 0; i <= 100; i += 5){
      cur.insert_child(i ,["hi"]);
    }
    for (let i = 1; i <= 100; i += 5){
      cur.insert_child(i ,["hi"]);
    }
    for (let i = 2; i <= 100; i += 5){
      cur.insert_child(i ,["hi"]);
    }
    for (let i = 3; i <= 100; i += 5){
      cur.insert_child(i ,["hi"]);
    }
    for (let i = 4; i <= 100; i += 5){
      cur.insert_child(i ,["hi"]);
    }
    
    for (let i = 0; i <= 100; i ++){
      if ((cur.search(i) as Array<string>)[0] !== "hi"){
        throw new Error("Problem with the search");
      }
    }
    for (let i = 101; i <= 200; i++){
      if (typeof cur.search(i) !== "undefined"){
        throw new Error("Problem with the search");
      }
    }
  }

  deleteTest001(){
    let cur:BNode<Array<string>> = new BNode(undefined, 5);

    for (let i = 0; i <= 1000; i ++){
      cur.insert_child(i ,["hi"]);
    }

    // cur.print_tree();
    cur.validate_tree();

    for (let i = 0; i <= 1000; i++){
      cur = cur.delete(i)
      // root.print_tree();
      cur.validate_tree();
    }
  }
  deleteTest002(){
    let cur:BNode<Array<string>> = new BNode(undefined, 5);
    let leap = 5;
    let max = 1000;
    for (let j = 0; j < leap; j++){
      for (let i = j; i <= max; i += leap){
        cur.insert_child(i ,["hi"]);
      }
    }

    cur.validate_tree();
    for (let j = 0; j < leap; j++){
      for (let i = j; i <= max; i += leap){
        // console.log("Deleting " + i);
        cur = cur.delete(i)
        // cur.print_tree();
        cur.validate_tree();
      }
    }
  }
  deleteTest003(){
    let cur:BNode<Array<string>> = new BNode(undefined, 5);
    let leap = 5;
    let max = 1000;
    for (let j = 0; j < leap; j++){
      for (let i = j; i <= max; i += leap){
        cur.insert_child(i ,["hi"]);
      }
    }

    cur.validate_tree();
    for (let j = 0; j < leap; j++){
      for (let i = j; i <= max; i += leap){
        // console.log("Deleting " + i);
        cur = cur.delete(i)
        // cur.print_tree();
        cur.validate_tree();
      }
    }

    for (let j = 0; j < leap; j++){
      for (let i = j; i <= max; i += leap){
        cur.insert_child(i ,["hi"]);
      }
      for (let i = j; i <= max; i += leap){
        // console.log("Deleting " + i);
        cur = cur.delete(i)
        // root.print_tree();
        cur.validate_tree();
      }
    }
  }

  test_bnode_tree_to_node_map(){
    let cur:BNode<Array<string>> = new BNode(undefined, 5);
  
    for (let i = 0; i <= 100; i ++){
      cur.insert_child(i ,["hi"]);
    }
  
    cur.print_tree();
  
    console.log(cur.bnode_tree_to_node_map());
  }
  
  async test_async(){
    let cur:BNode<number> = new BNode(undefined, 4);
    for (let i = 0; i < 100; i++){
      let map:Map<number, number> = new Map();
      map.set(i,i);
      cur.create_transaction({writes:map, reads:map});
    }
  }
}

// let t = new Testing();
// t.allTests();