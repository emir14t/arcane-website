type Key = number;
type Nullable<K> = undefined | K;

export class BNode<Data> {
    // Data
    private parent:Nullable<BNode<Data>>;
    private children:Array<BNode<Data>> = [];
    private thresholds:Array<Key> = new Array<Key>();
    private datas:Array<Data> = new Array<Data>();
    private maxNumberOfThresholds:number = -1;
    private minNumberOfThresholds:number = -1;
  
    // Constructor
    constructor(parent:Nullable<BNode<Data>>, maxNumberOfThresholds:number){
      //Initialization
      if (maxNumberOfThresholds < 2){throw new Error("Disallowed initialization");}
  
      this.parent = parent;
      this.maxNumberOfThresholds = maxNumberOfThresholds;
      this.minNumberOfThresholds = Math.floor((maxNumberOfThresholds)/2)
    }
  
  
    // Search algorithm (returns the Data associated with the userID if it exists and undefined if the userID doesn't exist)
    search(userID:Key):Nullable<BNode<Data>>{
      return this._search_up(userID);
    }
    private _search_down(userID:Key):Nullable<BNode<Data>>{
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
    private _search_up(userID:Key):Nullable<BNode<Data>>{
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
      if (this.thresholds.length > this.maxNumberOfThresholds){
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
        let tmpParent:BNode<Data> = new BNode(undefined, this.maxNumberOfThresholds); //, this.transactionService
        tmpParent.children.push(this);
        this.parent = tmpParent;
        return tmpParent._split_node(userID, this);
      }
  
      return (this.parent as BNode<Data>)._split_node(userID, this);
    }
    private _split_node(userID:Key, childBNode:BNode<Data>):(BNode<Data>|undefined){
      //Assuming that childBNode.parent === this
      let newBNode:BNode<Data> = new BNode<Data>(this, this.maxNumberOfThresholds); //, this.transactionService
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
    private _split_node_wrapper_nr():void{
      //This handles the edge cases before asking parent to split this BNode
      if (typeof this.parent === "undefined"){
        let tmpParent:BNode<Data> = new BNode(undefined, this.maxNumberOfThresholds); //, this.transactionService
        tmpParent.children.push(this);
        this.parent = tmpParent;
        return tmpParent._split_node_nr(this);
      }
  
      return (this.parent as BNode<Data>)._split_node_nr(this);
    }
    private _split_node_nr(childBNode:BNode<Data>):void{
      //Assuming that childBNode.parent === this
      let newBNode:BNode<Data> = new BNode<Data>(this, this.maxNumberOfThresholds); //, this.transactionService
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
  
    // Deletion algorithm (returns a valid BNode<Data>)
    delete(userID:Key):BNode<Data>{
      return this._delete_up(userID);
    }
    private _delete_down(userID:Key):BNode<Data>{
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
          return this._delete_wrapper(index);
        }
      }
      return this.parent._delete_up(userID);
    }
    private _delete_wrapper(index:number):BNode<Data>{
      //Assuming that userID is present in this.children
      //Case 1: Leaf
      if (this.children.length === 0){
        return this._leaf_handler(index)
      }
  
      return this._internal_handler(index)
    }
    private _leaf_handler(index:number):BNode<Data>{
      this.datas.splice(index, 1);
      this.thresholds.splice(index, 1);
  
      if (this.datas.length < this.minNumberOfThresholds){
        if (typeof this.parent == "undefined"){
          return this;
        }
        return (this.parent as BNode<Data>)._balance_tree(this);
      }
      return this;
    }
    private _internal_handler(index:number):BNode<Data>{
      let leftChild:BNode<Data> = this.children[index];
      let rightChild:BNode<Data> = this.children[index + 1];
  
      //Case 2.b: Rotation
      //Case 2.ba: Left child has more entries
      let childToDeleteFrom = this._can_promote_left(leftChild);
      if (typeof childToDeleteFrom !== "undefined"){
        let indexToRem:number = childToDeleteFrom.thresholds.length - 1;
        let thresholdToRem:Key = childToDeleteFrom.thresholds[indexToRem];
        let dataToRem:Data = childToDeleteFrom.datas[indexToRem];
  
        childToDeleteFrom._delete_wrapper(indexToRem);
  
        this.thresholds[index] = thresholdToRem;
        this.datas[index] = dataToRem;
        
        return this._should_balance_tree()
      }
  
      //Case 2.bb: Right child has more (or equal) entries
      childToDeleteFrom = this._can_promote_right(rightChild)
      if (typeof childToDeleteFrom !== "undefined"){
        let thresholdToRem:Key = childToDeleteFrom.thresholds[0];
        let dataToRem:Data = childToDeleteFrom.datas[0];
  
        childToDeleteFrom._delete_wrapper(0);
  
        this.thresholds[index] = thresholdToRem;
        this.datas[index] = dataToRem;
        
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
    private _can_promote_left(leftChild:BNode<Data>):Nullable<BNode<Data>>{
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
    private _can_promote_right(rightChild:BNode<Data>):Nullable<BNode<Data>>{
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
        return (this.parent as BNode<Data>)._balance_tree(this);
      }
      return this;
    }
    private _naive_merge(BNode1:BNode<Data>, BNode2:BNode<Data>){
      if (BNode1.children.length === 0){
        BNode1.datas.push(...BNode2.datas)
        BNode1.thresholds.push(...BNode2.thresholds)
        return;
      }
      let left = BNode1.children[BNode1.children.length - 1];
      let right = BNode2.children.shift() as BNode<Data>
  
      BNode1.datas.push(...BNode2.datas)
      BNode1.thresholds.push(...BNode2.thresholds)
      BNode1.children.push(...BNode2.children);
  
      for (let child of BNode2.children){
        child.parent = BNode1;
      }
  
      this._naive_merge(left, right);
    }
    private _balance_tree(changedBNode:BNode<Data>):BNode<Data>{
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
  
      if (typeof this.parent !== "undefined"){
        return (this.parent as BNode<Data>)._balance_tree(this);
      }
      return this;
    }
    private _try_rotate_left(index:number):Nullable<BNode<Data>>{
      if (index - 1 >= 0){
        let child = this.children[index-1];
        let child2 = this.children[index];
        if (child.thresholds.length > this.minNumberOfThresholds){
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
      return undefined;
    }
    private _try_rotate_right(index:number):Nullable<BNode<Data>>{
      if (index + 1 < this.children.length){
        let child = this.children[index+1];
        let child2 = this.children[index];
        if (child.thresholds.length > this.minNumberOfThresholds){
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
      return undefined;
    }
    private _try_compress_right(index:number):Nullable<BNode<Data>>{
      if (index - 1 >= 0){
        if (this.children[index-1].thresholds.length + this.children[index].thresholds.length < this.maxNumberOfThresholds){
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
      return undefined;
    }
    private _try_compress_left(index:number):Nullable<BNode<Data>>{
      if (index + 1 < this.children.length){
        if (this.children[index].thresholds.length + this.children[index+1].thresholds.length < this.maxNumberOfThresholds){
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
    
    // Helpers
    has(userID:Key){
      return this.thresholds.includes(userID);
    }
    get_index_of(child:BNode<Data>){
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