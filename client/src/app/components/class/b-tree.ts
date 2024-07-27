// import { Node,Transaction } from "src/app/interface/interface";
import { Mutex } from 'async-mutex';
// import { BUBBLE_UP_WAIT_TIME,TRANSACTION_WAIT_TIME } from "src/app/constants"; 
// import { TransactionService } from "src/app/services/transaction.service";

export interface Node {
  id : number,
  depth : number,
  breadth : number,
  parent : number | null,
  value: any,
}
export interface Transaction{
  writes: any[],
  reads: any[],
  target: User[]
}

export const MIN_BUBBLE_UP_WAIT_TIME:number = 500;   // How long(ms) does each node wait for more transactions before bubbleling up
export const MIN_TRANSACTION_WAIT_TIME:number = 30; // How long(ms) does each node wait before sending the data to his parent (applies after bubble up wait time)
export const MAX_BUBBLE_UP_WAIT_TIME:number = 500;   // How long(ms) does each node wait for more transactions before bubbleling up
export const MAX_TRANSACTION_WAIT_TIME:number = 30; // How long(ms) does each node wait before sending the data to his parent (applies after bubble up wait time)


type Key = number;
type Nullable<K> = undefined | K;
type Data = string;

function process_transactions(transactions:Array<Transaction>){
  let output:Array<String> = [];
  transactions.forEach((t) => {
    output.push(`transaction : w => ${t.reads.toString()}, r => ${t.writes.toString()}`);
  })
  // console.log(output.toString());
}

export class User{
  private userID:Key;
  private data:Data;
  private curNode:BNode;

  constructor(userID:Key, data:Data, curBNode:BNode){
    this.userID = userID;
    this.data = data;
    this.curNode = curBNode;
  }

  update_cur_node(newNode:BNode){
    this.curNode = newNode;
  }
  get_cur_node(){
    return this.curNode;
  }
  compare_id(test_id:Key):boolean{
    return test_id === this.userID;
  }
  get_data(){
    return this.data;
  }

  send_transaction(transaction:Transaction){
    this.curNode.create_transaction(transaction, this.userID)
  }
}
export class BNode {
  //Signals
  transaction_is_arriving(id: number){
    // this.transactionService.transactionIsArriving(id);
  }
  transaction_is_leaving(id: number){
    // this.transactionService.transactionIsLeaving(id);
  }
  
  // Data
  private parent:Nullable<BNode>;
  private children:Array<BNode> = [];
  private thresholds:Array<Key> = new Array<Key>();
  private datas:Array<User> = new Array<User>();
  private maxNumberOfThresholds:number = -1;
  private minNumberOfThresholds:number = -1;

  // Constructor
  constructor(parent:Nullable<BNode>, maxNumberOfThresholds:number){ //, private transactionService: TransactionService
    //Initialization
    if (maxNumberOfThresholds < 2){throw new Error("Disallowed initialization");}

    this.parent = parent;
    this.maxNumberOfThresholds = maxNumberOfThresholds;
    this.minNumberOfThresholds = Math.floor((maxNumberOfThresholds)/2)
  }

  // Transactions
  private my_lock = new Mutex();
  private all_cur_transactions:Array<Transaction> = []
  async create_transaction(transaction:Transaction, userID:Key){
    this._data_collection([transaction]);
  }
  private async _data_collection(transactions:Array<Transaction>, userID?:Key):Promise<void>{
    if (typeof userID !== "undefined"){
      this.transaction_is_arriving(userID);
    }
    else{
      this.transaction_is_arriving(this.thresholds[0]);
    }
    await this.my_lock.acquire();
    try{
      let im_collecting = (this.all_cur_transactions.length === 0);
      this.all_cur_transactions.push(...transactions);
      if (im_collecting){
        setTimeout(this._bubble_up.bind(this), Math.random() * (MAX_BUBBLE_UP_WAIT_TIME-MIN_BUBBLE_UP_WAIT_TIME) + MIN_BUBBLE_UP_WAIT_TIME)
      }
    }
    finally{
      this.my_lock.release();
    }
  }
  private async _bubble_up(){
    this.transaction_is_leaving(this.thresholds[0]);
    await this.my_lock.acquire();
    try{
      if (typeof this.parent === "undefined"){
        setTimeout(process_transactions.bind(this), Math.random() * (MAX_TRANSACTION_WAIT_TIME-MIN_TRANSACTION_WAIT_TIME) + MIN_TRANSACTION_WAIT_TIME, this.all_cur_transactions);
      }
      else{
        setTimeout((this.parent as BNode)._data_collection.bind(this), Math.random() * (MAX_TRANSACTION_WAIT_TIME-MIN_TRANSACTION_WAIT_TIME) + MIN_TRANSACTION_WAIT_TIME, this.all_cur_transactions);
      }

      this.all_cur_transactions = []; 
    }
    finally{
      this.my_lock.release();
    }
  }

  // Search algorithm (returns the Data associated with the userID if it exists and undefined if the userID doesn't exist)
  search(userID:Key):Nullable<BNode>{
    return this._search_up(userID);
  }
  private _search_down(userID:Key):Nullable<BNode>{
    //Base case (leaf)
    if (this.children.length === 0){
      for (let index:number = 0; index < this.thresholds.length; index++){
        if (userID === this.thresholds[index]){return this;}
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
        return this;
      }
    }
    return this.children[this.children.length-1]._search_down(userID)
  }
  private _search_up(userID:Key):Nullable<BNode>{
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
        return this;
      }
    }
    return this.parent._search_up(userID);
  }


  // Insertion algorithm (returns a BNode<Data> that contains the user you added)
  insert_child(userID:Key, data:Data):BNode{
    return this._insert_child_up(userID, data);
  }
  private _insert_child_down(userID:Key, data:Data):BNode{
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
        throw new Error("UserError: Cannot add same user twice to the tree");
      }
    }
    return this.children[this.children.length-1]._insert_child_down(userID, data)
  }
  private _insert_child_up(userID:Key, data:Data):BNode{
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
        throw new Error("UserError: Cannot add same user twice to the tree");
      }
    }
    return this.parent._insert_child_up(userID, data);
  }
  private _add_data_to_node(userID:Key, data:Data):BNode{
    //Assuming that the userID doesn't exist in the array
    //Add to arrays
    if (this.thresholds.length == 0){
      this.thresholds.push(userID);
      this.datas.push(new User(userID, data, this));
    }
    else if (userID < this.thresholds[0]){
      this.thresholds.unshift(userID);
      this.datas.unshift(new User(userID, data, this))
    }
    else if (userID > this.thresholds[this.thresholds.length - 1]){
      this.thresholds.push(userID);
      this.datas.push(new User(userID, data, this));
    }
    else{
      //Technically can change to bin search but not my problem
      for (let i = 0; i < this.thresholds.length - 1; i++){
        if (userID < this.thresholds[i+1] && userID > this.thresholds[i]){
          this.thresholds.splice(i+1, 0, userID);
          this.datas.splice(i+1, 0, new User(userID, data, this));
        }
      }
    }

    //Check if we have to split
    if (this.thresholds.length > this.maxNumberOfThresholds){
      if (!this.thresholds.includes(userID)){
        throw new Error("Threshold doesn't show that we've added the user");
      }
      return (this._split_node_wrapper(userID) as BNode);
    }
    return this;
  }
  private _split_node_wrapper(userID:Key):(Nullable<BNode>){
    //This handles the edge cases before asking parent to split this BNode
    if (typeof this.parent === "undefined"){
      let tmpParent:BNode = new BNode(undefined, this.maxNumberOfThresholds); //, this.transactionService
      tmpParent.children.push(this);
      this.parent = tmpParent;
      return tmpParent._split_node(userID, this);
    }

    return (this.parent as BNode)._split_node(userID, this);
  }
  private _split_node(userID:Key, childBNode:BNode):(Nullable<BNode>){
    //Assuming that childBNode.parent === this
    let newBNode:BNode = new BNode(this, this.maxNumberOfThresholds); //, this.transactionService
    let sizePartition1:number = Math.floor(childBNode.thresholds.length/2);
    let keyToPromote:Key = childBNode.thresholds[sizePartition1];
    let dataToPromote:User = childBNode.datas[sizePartition1];

    //Spliting the BNode into three, the original childBNode pointer, the new newBNode pointer and the new promoted data
    newBNode.datas = childBNode.datas.slice(0, sizePartition1);
    newBNode.thresholds = childBNode.thresholds.slice(0, sizePartition1);
    newBNode.children = childBNode.children.slice(0, sizePartition1 + 1);
    for (let child of newBNode.children){
      child.parent = newBNode;
    }
    for (let data of newBNode.datas){
      data.update_cur_node(newBNode);
    }

    childBNode.datas = childBNode.datas.slice(sizePartition1 + 1);
    childBNode.thresholds = childBNode.thresholds.slice(sizePartition1 + 1);
    childBNode.children = childBNode.children.slice(sizePartition1 + 1);

    //Add the information to the tree
    //Newly added parents
    dataToPromote.update_cur_node(this);
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
    else {
      if (keyToPromote < this.thresholds[0]){
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
    }

    //Check if we have to split
    if (this.thresholds.length > this.maxNumberOfThresholds){
      let ans:(Nullable<BNode>) = this._split_node_wrapper(userID);
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
  private _split_node_wrapper_nr():void{
    //This handles the edge cases before asking parent to split this BNode
    if (typeof this.parent === "undefined"){
      let tmpParent:BNode = new BNode(undefined, this.maxNumberOfThresholds); //, this.transactionService
      tmpParent.children.push(this);
      this.parent = tmpParent;
      return tmpParent._split_node_nr(this);
    }

    return (this.parent as BNode)._split_node_nr(this);
  }
  private _split_node_nr(childBNode:BNode):void{
    //Assuming that childBNode.parent === this
    let newBNode:BNode = new BNode(this, this.maxNumberOfThresholds); //, this.transactionService
    let sizePartition1:number = Math.floor(childBNode.thresholds.length/2);
    let keyToPromote:Key = childBNode.thresholds[sizePartition1];
    let dataToPromote:User = childBNode.datas[sizePartition1];

    //Spliting the BNode into three, the original childBNode pointer, the new newBNode pointer and the new promoted data
    newBNode.datas = childBNode.datas.slice(0, sizePartition1);
    newBNode.thresholds = childBNode.thresholds.slice(0, sizePartition1);
    newBNode.children = childBNode.children.slice(0, sizePartition1 + 1);
    for (let child of newBNode.children){
      child.parent = newBNode;
    }
    for (let data of newBNode.datas){
      data.update_cur_node(newBNode);
    }

    childBNode.datas = childBNode.datas.slice(sizePartition1 + 1);
    childBNode.thresholds = childBNode.thresholds.slice(sizePartition1 + 1);
    childBNode.children = childBNode.children.slice(sizePartition1 + 1);

    //Add the information to the tree
    //Newly added parents
    dataToPromote.update_cur_node(this);
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
    else {
      if (keyToPromote < this.thresholds[0]){
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
    }

    //Check if we have to split
    if (this.thresholds.length > this.maxNumberOfThresholds){
      this._split_node_wrapper_nr();
    }
  }

  // Deletion algorithm (returns a valid BNode)
  delete(userID:Key):BNode{
    return this._delete_up(userID);
  }
  private _delete_down(userID:Key):BNode{
    //Base case (leaf)
    if (this.children.length === 0){
      for (let index:number = 0; index < this.thresholds.length; index++){
        if (userID === this.thresholds[index]){
          return this._delete_wrapper(index);
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
        return this._delete_wrapper(index);
      }
    }
    return this.children[this.children.length-1]._delete_down(userID)
  }
  private _delete_up(userID:Key):BNode{
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
        return this._delete_wrapper(index);
      }
    }
    return this.parent._delete_up(userID);
  }
  private _delete_wrapper(index:number):BNode{
    //Assuming that userID is present in this.children
    //Case 1: Leaf
    if (this.children.length === 0){
      return this._leaf_handler(index)
    }

    return this._internal_handler(index)
  }
  private _leaf_handler(index:number):BNode{
    this.datas.splice(index, 1);
    this.thresholds.splice(index, 1);

    if (this.datas.length < this.minNumberOfThresholds){
      if (typeof this.parent == "undefined"){
        return this;
      }
      return (this.parent as BNode)._balance_tree(this);
    }
    return this;
  }
  private _internal_handler(index:number):BNode{
    let leftChild:BNode = this.children[index];
    let rightChild:BNode = this.children[index + 1];

    //Case 2.b: Rotation
    //Case 2.ba: Left child has more entries
    let childToDeleteFrom = this._can_promote_left(leftChild);
    if (typeof childToDeleteFrom !== "undefined"){
      let indexToRem:number = childToDeleteFrom.thresholds.length - 1;
      let thresholdToRem:Key = childToDeleteFrom.thresholds[indexToRem];
      let dataToRem:User = childToDeleteFrom.datas[indexToRem];

      childToDeleteFrom._delete_wrapper(indexToRem);

      this.thresholds[index] = thresholdToRem;
      this.datas[index] = dataToRem;
      dataToRem.update_cur_node(this);
      
      return this._should_balance_tree()
    }

    //Case 2.bb: Right child has more (or equal) entries
    childToDeleteFrom = this._can_promote_right(rightChild)
    if (typeof childToDeleteFrom !== "undefined"){
      let thresholdToRem:Key = childToDeleteFrom.thresholds[0];
      let dataToRem:User = childToDeleteFrom.datas[0];

      childToDeleteFrom._delete_wrapper(0);

      this.thresholds[index] = thresholdToRem;
      this.datas[index] = dataToRem;
      dataToRem.update_cur_node(this);
      
      return this._should_balance_tree()
    }

    //Case 2.a: Compression
    if (leftChild.thresholds.length + rightChild.thresholds.length <= this.maxNumberOfThresholds){
      this.children.splice(index + 1, 1);
      this.datas.splice(index, 1);
      this.thresholds.splice(index, 1);

      this._naive_merge(leftChild, rightChild);

      return this._should_balance_tree()
    }
    throw new Error("Unresolved here");
  }
  private _can_promote_left(leftChild:BNode):Nullable<BNode>{
    let childToDeleteFrom = leftChild;
    let possible = false;
    while(childToDeleteFrom.children.length !== 0){
      if (childToDeleteFrom.thresholds.length > this.minNumberOfThresholds){
        possible = true;
      }
      childToDeleteFrom = childToDeleteFrom.children[childToDeleteFrom.children.length - 1];
    }
    if (childToDeleteFrom.thresholds.length > this.minNumberOfThresholds){
      possible = true;
    }

    if(possible){
      return childToDeleteFrom
    }
    return undefined;
  }
  private _can_promote_right(rightChild:BNode):Nullable<BNode>{
    let childToDeleteFrom = rightChild;
    let possible = false;
    while(childToDeleteFrom.children.length !== 0){
      if (childToDeleteFrom.thresholds.length > this.minNumberOfThresholds){
        possible = true;
      }
      childToDeleteFrom = childToDeleteFrom.children[0];
    }
    if (childToDeleteFrom.thresholds.length > this.minNumberOfThresholds){
      possible = true;
    }

    if(possible){
      return childToDeleteFrom
    }
    return undefined;
  }
  private _should_balance_tree(){
    if (this.datas.length < this.minNumberOfThresholds){
      if (typeof this.parent == "undefined"){
        return this;
      }
      return (this.parent as BNode)._balance_tree(this);
    }
    return this;
  }
  private _naive_merge(BNode1:BNode, BNode2:BNode){
    for (let node of BNode2.datas){
      node.update_cur_node(BNode1);
    }
    if (BNode1.children.length === 0){
      BNode1.datas.push(...BNode2.datas)
      BNode1.thresholds.push(...BNode2.thresholds)
      return;
    }
    let left = BNode1.children[BNode1.children.length - 1];
    let right = BNode2.children.shift() as BNode

    BNode1.datas.push(...BNode2.datas)
    BNode1.thresholds.push(...BNode2.thresholds)
    BNode1.children.push(...BNode2.children);

    for (let child of BNode2.children){
      child.parent = BNode1;
    }

    this._naive_merge(left, right);
  }
  private _balance_tree(changedBNode:BNode):BNode{
    // Making sure that we need to do this
    if (changedBNode.thresholds.length >= this.minNumberOfThresholds){
      return this;
    }

    //Finding the index
    let index:number = this.get_index_of(changedBNode)

    // See if we can compress the entire thing
    if (this._can_compress_all()){
      return this._compress_all_children_into_me()
    }

    // Case 2: Rotate
    // If left child exists
    let tmp_ret = this._try_rotate_left(index);
    if (typeof tmp_ret !== "undefined"){
      return tmp_ret;
    }
    // If the right child exists
    tmp_ret = this._try_rotate_right(index);
    if (typeof tmp_ret !== "undefined"){
      return tmp_ret;
    }
    
    // Case 1: Compress
    // If the left child exists
    tmp_ret = this._try_compress_left(index);
    if (typeof tmp_ret !== "undefined"){
      return tmp_ret;
    }
    
    // If the right child exists
    tmp_ret = this._try_compress_right(index);
    if (typeof tmp_ret !== "undefined"){
      return tmp_ret;
    }
    
    throw new Error("Balancing failed");
  }
  private _can_compress_all(){
    let total:number = this.thresholds.length;
    for (let child of this.children){
      total += child.thresholds.length;
    }
    return (total <= this.maxNumberOfThresholds)
  }
  private _compress_all_children_into_me(){
    let iter = this.thresholds.length;
    for (let i = iter; i >= 0; i--){
      for (let data of this.children[i].datas){
        data.update_cur_node(this);
      }
      this.thresholds.splice(i, 0, ...this.children[i].thresholds);
      this.datas.splice(i, 0, ...this.children[i].datas);
    }

    let tmpChildren:Array<BNode> = this.children;
    this.children = [];
    for (let child of tmpChildren){
      this.children.push(...child.children);
    }
    for (let child of this.children){
      child.parent = this;
    }

    if (typeof this.parent !== "undefined"){
      return (this.parent as BNode)._balance_tree(this);
    }
    return this;
  }
  private _try_rotate_left(index:number):Nullable<BNode>{
    if (index - 1 >= 0){
      let child = this.children[index-1];
      let child2 = this.children[index];
      if (child.thresholds.length > this.minNumberOfThresholds){
        let tmpKey = child.thresholds.pop() as Key;
        let tmpData = child.datas.pop() as User;

        if (child.children.length !== 0){
          let tmpChild = child.children.pop() as BNode;
          child2.children.unshift(tmpChild);
          tmpChild.parent = child2;
        }

        let tmpKey1 = this.thresholds[index - 1];
        let tmpData1 = this.datas[index - 1];
        this.thresholds[index - 1] = tmpKey;
        this.datas[index - 1] = tmpData;
        tmpData.update_cur_node(this)

        child2.thresholds.unshift(tmpKey1);
        child2.datas.unshift(tmpData1);
        tmpData1.update_cur_node(child2);
        return this;
      }
    }
    return undefined;
  }
  private _try_rotate_right(index:number):Nullable<BNode>{
    if (index + 1 < this.children.length){
      let child = this.children[index+1];
      let child2 = this.children[index];
      if (child.thresholds.length > this.minNumberOfThresholds){
        let tmpKey = child.thresholds.shift() as Key;
        let tmpData = child.datas.shift() as User;

        if (child.children.length !== 0){
          let tmpChild = child.children.shift() as BNode;
          child2.children.push(tmpChild);
          tmpChild.parent = child2;
        }

        let tmpKey1 = this.thresholds[index];
        let tmpData1 = this.datas[index];
        this.thresholds[index] = tmpKey;
        this.datas[index] = tmpData;
        tmpData.update_cur_node(this);

        child2.thresholds.push(tmpKey1);
        child2.datas.push(tmpData1);
        tmpData1.update_cur_node(child2)
        return this;
      }
    }
    return undefined;
  }
  private _try_compress_right(index:number):Nullable<BNode>{
    if (index - 1 >= 0){
      if (this.children[index-1].thresholds.length + this.children[index].thresholds.length < this.maxNumberOfThresholds){
        let child:BNode = this.children[index - 1];
        let child2:BNode = this.children.splice(index, 1)[0];
        let tmpKey:Key = this.thresholds.splice(index-1, 1)[0];
        let tmpData:User = this.datas.splice(index-1, 1)[0];
        
        for (let data of child2.datas){
          data.update_cur_node(child)
        }
        for (let tmpChild of child2.children){
          tmpChild.parent = child;
        }
        tmpData.update_cur_node(child)

        child.thresholds.push(tmpKey, ...child2.thresholds);
        child.datas.push(tmpData, ...child2.datas);
        child.children.push(...child2.children);
        
        this._balance_tree(this.children[index-1]);
        if (typeof this.parent !== "undefined"){
          return (this.parent as BNode)._balance_tree(this);
        }
        return this;
      }
    }
    return undefined;
  }
  private _try_compress_left(index:number):Nullable<BNode>{
    if (index + 1 < this.children.length){
      if (this.children[index].thresholds.length + this.children[index+1].thresholds.length < this.maxNumberOfThresholds){
        let child:BNode = this.children[index];
        let child2:BNode = this.children.splice(index+1, 1)[0];
        let tmpKey:Key = this.thresholds.splice(index, 1)[0];
        let tmpData:User = this.datas.splice(index, 1)[0];
        
        for (let data of child2.datas){
          data.update_cur_node(child)
        }
        for (let tmpChild of child2.children){
          tmpChild.parent = child;
        }
        tmpData.update_cur_node(child)

        child.thresholds.push(tmpKey, ...child2.thresholds);
        child.datas.push(tmpData, ...child2.datas);
        child.children.push(...child2.children);

        this._balance_tree(this.children[index]);
        if (typeof this.parent !== "undefined"){
          return (this.parent as BNode)._balance_tree(this);
        }
        return this;
      }
    }
    return undefined;
  }

  // Validation algorithm (checks the integrety of the BTree)
  validate_tree():void{
    this._validate_up();
  }
  private _validate_self(minNumb:number, maxNumb:number):void{
    //Validate lengths
    if (this.datas.length !== this.thresholds.length) {throw new Error("Datas and Threshold lengths are inconsistent");}
    if (this.children.length !== 0 && this.datas.length !== (this.children.length - 1)) {throw new Error("Children lengths are inconsistent");}
    if (typeof this.parent !== "undefined" && this.datas.length < this.minNumberOfThresholds) {throw new Error("Tree has nodes with less than the minimum amount of nodes ");}
    if (this.datas.length > this.maxNumberOfThresholds) {throw new Error("Tree has nodes with more than the maximum amount of nodes ");}
    
    //Validate ordering
    for (let i:number = 0; i < this.thresholds.length - 1; i++){
      if (this.thresholds[i] >= this.thresholds[i+1]){throw new Error("Threshold orderings are wrong");}
    }

    //Validate order of data
    if (this.thresholds[0] < minNumb){throw new Error("Thresholds in current node do not respect the min")}
    if (this.thresholds[this.thresholds.length - 1] > maxNumb){throw new Error("Thresholds in current node do not respect the max")}

    //Validate data
    for (let i = 0; i < this.datas.length; i++){
      let data = this.datas[i]
      if (data.get_cur_node() !== this){throw new Error("Users do not show the correct node")}
      if (!data.compare_id(this.thresholds[i])){throw new Error("Thresholds do not represent the User")}
    }
  }
  private _validate_up():void{
    if (typeof this.parent === "undefined"){return this._validate_down(-Infinity, Infinity);}

    return (this.parent as BNode)._validate_up()
  }
  private _validate_down(minNumb:number, maxNumb:number):void{
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
  private _print_tree_up():void{
    if(typeof this.parent != "undefined"){
      return (this.parent as BNode)._print_tree_up();
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
    return (this.parent as BNode).bnode_tree_to_node_map();
  }
  private _bnode_tree_to_node_map_down(root:BNode):Map<number, Node>{
    let queue1:Array<BNode> = [root];
    let queue2:Array<BNode> = [];
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
  
  // Helpers
  has(userID:Key){
    return this.thresholds.includes(userID);
  }
  get_index_of(child:BNode){
    let index = 0;
    for (let mychild of this.children){
      if (child === mychild){
        return index;
      }
      index++;
    }
    throw new Error("Could not find the child")
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
    this.deleteTest004();
    console.log("Works");
  }

  insertionTest001(){
    let cur:BNode = new BNode(undefined, 5);

    for (let i = 0; i <= 100; i += 5){
      cur = cur.insert_child(i ,"hi");
    }
    for (let i = 1; i <= 100; i += 5){
      cur = cur.insert_child(i ,"hi");
    }
    for (let i = 2; i <= 100; i += 5){
      cur = cur.insert_child(i ,"hi");
    }
    for (let i = 3; i <= 100; i += 5){
      cur = cur.insert_child(i ,"hi");
    }
    for (let i = 4; i <= 100; i += 5){
      cur = cur.insert_child(i ,"hi");
    }

    cur.validate_tree();
  }
  insertionTest002(){
    let cur:BNode = new BNode(undefined, 5);

    for (let i = 0; i <= 100; i ++){
      cur = cur.insert_child(i ,"hi");
    }
    
    cur.validate_tree();
  }
  insertionTest003(){
    let cur:BNode = new BNode(undefined, 6);

    for (let i = 100; i >= 0; i --){
      cur = cur.insert_child(i ,"hi");
    }
    
    cur.validate_tree();
  }
  insertionTest004(){
    let cur:BNode = new BNode(undefined, 5);

    for (let i = 0; i <= 100; i ++){
      cur = cur.insert_child(i ,"hi");
      if (!cur.has(i)){
        throw new Error("Output isnt correct");
      }
    }
  }

  searchTest001(){
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
      if (!(cur.search(i) as BNode).has(i)){
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
    let cur:BNode = new BNode(undefined, 5);

    for (let i = 0; i <= 1000; i ++){
      cur.insert_child(i ,"hi");
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
        // console.log("Deleting " + i);
        cur = cur.delete(i)
        // cur.print_tree();
        cur.validate_tree();
      }
    }
  }
  deleteTest003(){
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
        // console.log("Deleting " + i);
        cur = cur.delete(i)
        // cur.print_tree();
        cur.validate_tree();
      }
    }

    for (let j = 0; j < leap; j++){
      for (let i = j; i <= max; i += leap){
        cur.insert_child(i ,"hi");
      }
      for (let i = j; i <= max; i += leap){
        // console.log("Deleting " + i);
        cur = cur.delete(i)
        // root.print_tree();
        cur.validate_tree();
      }
    }
  }
  deleteTest004(){
    let set:Array<Key> = [];
    let cur:BNode = new BNode(undefined, 6);
    
    let empty_all = false
    for(let i = 0; i < 20000; i++){
      if (set.length === 0){
        empty_all = false;
      }
      if (empty_all === true){
        let random_index:number = Math.floor(Math.random() * set.length)
        cur = cur.delete(set[random_index])
        set.splice(random_index,1);
        continue;
      }
      if (set.length > 1000){
        empty_all = true
        console.log("Emptying")
        continue;
      }
      else if (set.length < 2){
        let random_number = Math.floor(Math.random() * 100000)
        while (set.includes(random_number)){
          random_number = Math.floor(Math.random() * 100000);
        }
        cur.insert_child(random_number, "hi");
        set.push(random_number)
      }
      else{
        if (Math.random() < 0.55){
          let random_number = Math.floor(Math.random() * 100000)
          while (set.includes(random_number)){
            random_number = Math.floor(Math.random() * 100000);
          }
          cur.insert_child(random_number, "hi");
          set.push(random_number)
        }
        else{
          let random_index:number = Math.floor(Math.random() * set.length)
          cur = cur.delete(set[random_index])
          set.splice(random_index,1);
        }
      }
      // cur.print_tree()
      cur.validate_tree()
      // console.log(set.length)
    }
    // console.log(set.length)
    // cur.print_tree()
  }

  test_bnode_tree_to_node_map(){
    let cur:BNode = new BNode(undefined, 5);
  
    for (let i = 0; i <= 100; i ++){
      cur.insert_child(i ,"hi");
    }
  
    cur.print_tree();
  
    console.log(cur.bnode_tree_to_node_map());
  }
  
  // async test_async(){
  //   let cur:BNode<number> = new BNode(undefined, 4);
  //   for (let i = 0; i < 100; i++){
  //     cur.create_transaction({writes:[i], reads:[i]});
  //   }
  // }
}


let t = new Testing();
t.allTests();