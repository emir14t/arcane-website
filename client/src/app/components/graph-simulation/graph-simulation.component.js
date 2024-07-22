// import { Component } from '@angular/core';
// import { InjectSetupWrapper } from '@angular/core/testing';
// import { merge } from 'rxjs';
var BNode = /** @class */ (function () {
    function BNode(parent, maxDegree) {
        this.children = [];
        this.thresholds = new Array();
        this.datas = new Array();
        this.maxDegree = -1;
        if (maxDegree < 2) {
            throw new Error("Unallowed initialization");
        }
        this.parent = parent;
        this.maxDegree = maxDegree;
    }
    //Signals
    BNode.prototype.parent_changed = function (newParent) {
    };
    BNode.prototype.search_down = function (userID) {
        //Base case (leaf)
        if (this.children.length === 0) {
            for (var index = 0; index < this.thresholds.length; index++) {
                if (userID === this.thresholds[index]) {
                    return this.datas[index];
                }
            }
            return undefined;
        }
        //Iterate over the thresholds to find where the data is
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                return this.children[index].search_down(userID);
            }
            else if (userID === threshold) {
                return this.datas[index];
            }
        }
        return this.children[this.children.length - 1].search_down(userID);
    };
    BNode.prototype.search_up = function (userID) {
        //Base case (root)
        if (typeof this.parent === "undefined") {
            return this.search_down(userID);
        }
        //Iterate over the thresholds to find where the data could be
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                if (index === 0) {
                    return this.parent.search_up(userID);
                }
                if (this.children.length === 0) {
                    return this.search_down(userID);
                }
                return this.children[index].search_down(userID);
            }
            else if (userID === threshold) {
                return this.datas[index];
            }
        }
        return this.parent.search_up(userID);
    };
    BNode.prototype.insert_child_down = function (userID, data) {
        //Base case (leaf)
        if (this.children.length === 0) {
            return this.add_data_to_BNode(userID, data);
        }
        //Iterate over the thresholds to find where the data is
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                return this.children[index].insert_child_down(userID, data);
            }
            else if (userID === threshold) {
                throw new Error("Cannot add same user twice to the tree");
            }
        }
        return this.children[this.children.length - 1].insert_child_down(userID, data);
    };
    BNode.prototype.insert_child_up = function (userID, data) {
        //Base case (root)
        if (typeof this.parent === "undefined") {
            return this.insert_child_down(userID, data);
        }
        //Iterate over the thresholds to find where the data could be
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                if (index === 0) {
                    return this.parent.insert_child_up(userID, data);
                }
                if (this.children.length === 0) {
                    return this.add_data_to_BNode(userID, data);
                }
                return this.children[index].insert_child_down(userID, data);
            }
            else if (userID === threshold) {
                throw new Error("Cannot add same user twice to the tree");
            }
        }
        return this.parent.insert_child_up(userID, data);
    };
    BNode.prototype.add_data_to_BNode = function (userID, data) {
        //Assuming that the userID doesn't exist in the array
        //Add to arrays
        if (this.thresholds.length == 0) {
            this.thresholds.push(userID);
            this.datas.push(data);
        }
        else if (userID < this.thresholds[0]) {
            this.thresholds.unshift(userID);
            this.datas.unshift(data);
        }
        else if (userID > this.thresholds[this.thresholds.length - 1]) {
            this.thresholds.push(userID);
            this.datas.push(data);
        }
        else {
            //Technically can change to bin search but not my problem
            for (var i = 0; i < this.thresholds.length - 1; i++) {
                if (userID < this.thresholds[i + 1] && userID > this.thresholds[i]) {
                    this.thresholds.splice(i + 1, 0, userID);
                    this.datas.splice(i + 1, 0, data);
                }
            }
        }
        //Check if we have to split
        if (this.thresholds.length > this.maxDegree) {
            return this.split_node_wrapper();
        }
    };
    BNode.prototype.split_node_wrapper = function () {
        //This handles the edge cases before asking parent to split this BNode
        if (typeof this.parent === "undefined") {
            var tmpParent = new BNode(undefined, this.maxDegree);
            tmpParent.children.push(this);
            this.parent = tmpParent;
            this.parent_changed(tmpParent);
            return tmpParent.split_node(this);
        }
        return this.parent.split_node(this);
    };
    BNode.prototype.split_node = function (childBNode) {
        //Assuming that childBNode.parent === this
        var newBNode = new BNode(this, this.maxDegree);
        var sizePartition1 = Math.floor(childBNode.thresholds.length / 2);
        var keyToPromote = childBNode.thresholds[sizePartition1];
        var dataToPromote = childBNode.datas[sizePartition1];
        //Spliting the BNode into three, the original childBNode pointer, the new newBNode pointer and the new promoted data
        newBNode.datas = childBNode.datas.slice(0, sizePartition1);
        newBNode.thresholds = childBNode.thresholds.slice(0, sizePartition1);
        newBNode.children = childBNode.children.slice(0, sizePartition1 + 1);
        for (var _i = 0, _a = newBNode.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.parent = newBNode;
        }
        childBNode.datas = childBNode.datas.slice(sizePartition1 + 1);
        childBNode.thresholds = childBNode.thresholds.slice(sizePartition1 + 1);
        childBNode.children = childBNode.children.slice(sizePartition1 + 1);
        //Add the information to the tree
        //Newly added parents
        if (this.thresholds.length == 0) {
            if (this.children.length != 1) {
                throw new Error("Current BNode has no children nor thresholds");
            }
            if (this.children[0] !== childBNode) {
                throw new Error("Inconsistencies when adding BNodes (children doesn't represent child)");
            }
            this.children.unshift(newBNode);
            this.thresholds.unshift(keyToPromote);
            this.datas.unshift(dataToPromote);
        }
        //Finding the spot to add it
        else if (keyToPromote < this.thresholds[0]) {
            if (this.children[0] !== childBNode) {
                throw new Error("Inconsistencies when adding BNodes (children doesn't represent child)");
            }
            this.children.unshift(newBNode);
            this.thresholds.unshift(keyToPromote);
            this.datas.unshift(dataToPromote);
        }
        else if (keyToPromote > this.thresholds[this.thresholds.length - 1]) {
            this.children.splice(this.children.length - 1, 0, newBNode);
            this.thresholds.push(keyToPromote);
            this.datas.push(dataToPromote);
        }
        else if (keyToPromote === this.thresholds[this.thresholds.length - 1]) {
            throw new Error("Promoted BNode already exists in his parent's dataset. Node data:\'" + this.thresholds + "\', keyToPromote:" + keyToPromote);
        }
        else {
            for (var i = 0; i < this.thresholds.length - 1; i++) {
                if (keyToPromote > this.thresholds[i] && keyToPromote < this.thresholds[i + 1]) {
                    this.children.splice(i + 1, 0, newBNode);
                    this.thresholds.splice(i + 1, 0, keyToPromote);
                    this.datas.splice(i + 1, 0, dataToPromote);
                    break;
                }
                else if (keyToPromote == this.thresholds[i]) {
                    throw new Error("Promoted BNode already exists in his parent's dataset. Node data:\'" + this.thresholds + "\', keyToPromote:" + keyToPromote);
                }
            }
        }
        //Check if we have to split
        if (this.thresholds.length > this.maxDegree) {
            return this.split_node_wrapper();
        }
    };
    BNode.prototype.delete_down = function (userID) {
        //Base case (leaf)
        if (this.children.length === 0) {
            for (var index = 0; index < this.thresholds.length; index++) {
                if (userID === this.thresholds[index]) {
                    this.delete_wrapper(userID, index);
                    return true;
                }
            }
            return false;
        }
        //Iterate over the thresholds to find where the data is
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                return this.children[index].delete_down(userID);
            }
            else if (userID === threshold) {
                this.delete_wrapper(userID, index);
                return true;
            }
        }
        return this.children[this.children.length - 1].delete_down(userID);
    };
    BNode.prototype.delete_up = function (userID) {
        //Base case (root)
        if (typeof this.parent === "undefined") {
            return this.delete_down(userID);
        }
        //Iterate over the thresholds to find where the data could be
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                if (index === 0) {
                    return this.parent.delete_up(userID);
                }
                if (this.children.length === 0) {
                    return false;
                }
                return this.children[index].delete_down(userID);
            }
            else if (userID === threshold) {
                this.delete_wrapper(userID, index);
                return true;
            }
        }
        return this.parent.delete_up(userID);
    };
    BNode.prototype.delete_wrapper = function (userID, index) {
        //Assuming that userID is present in this.children
        //Assuming that children[index] == userID
        //Case 1: Leaf
        if (this.children.length === 0) {
            this.datas.splice(index, 1);
            this.thresholds.splice(index, 1);
            if (this.datas.length < this.maxDegree / 2) {
                if (typeof this.parent == "undefined") {
                    return;
                }
                this.parent.balance(this);
            }
            return;
        }
        var leftChild = this.children[index];
        var rightChild = this.children[index + 1];
        //Case 2: No leaf
        //Case 2.a: Compression
        if (leftChild.thresholds.length + rightChild.thresholds.length < this.maxDegree) {
            this.children.splice(index + 1, 1);
            this.datas.splice(index, 1);
            this.thresholds.splice(index, 1);
            this.mergeBNodes(leftChild, rightChild);
            if (this.datas.length < this.maxDegree / 2) {
                if (typeof this.parent == "undefined") {
                    return;
                }
                this.parent.balance(this);
            }
            return;
        }
        //Case 2.b: Rotation
        //Case 2.ba: Left child has more entries
        if (leftChild.thresholds.length > rightChild.thresholds.length) {
            var indexToRem = leftChild.thresholds.length - 1;
            var thresholdToRem = leftChild.thresholds[indexToRem];
            var dataToRem = leftChild.datas[indexToRem];
            this.children[index].delete_wrapper(thresholdToRem, indexToRem);
            this.thresholds[index] = thresholdToRem;
            this.datas[index] = dataToRem;
            if (this.datas.length < this.maxDegree / 2) {
                if (typeof this.parent == "undefined") {
                    return;
                }
                this.parent.balance(this);
            }
            return;
        }
        //Case 2.bb: Right child has more (or equal) entries
        else {
            var indexToRem = rightChild.thresholds.length - 1;
            var thresholdToRem = rightChild.thresholds[indexToRem];
            var dataToRem = rightChild.datas[indexToRem];
            this.children[index + 1].delete_wrapper(thresholdToRem, indexToRem);
            this.thresholds[index] = thresholdToRem;
            this.datas[index] = dataToRem;
            if (this.datas.length < this.maxDegree / 2) {
                if (typeof this.parent == "undefined") {
                    return;
                }
                this.parent.balance(this);
            }
            return;
        }
    };
    BNode.prototype.mergeBNodes = function (BNode1, BNode2) {
        //Assuming that both BNodes provided are from the same level
        //Base Case: leaves
        if (BNode1.children.length == 0) {
            BNode1.thresholds = BNode1.thresholds.concat(BNode2.thresholds);
            BNode1.datas = BNode1.datas.concat(BNode2.datas);
            return true;
        }
        var leftChild = BNode1.children[BNode1.children.length - 1];
        var rightChild = BNode2.children[0];
        //Case 1: We have to keep merging
        if (leftChild.thresholds.length + rightChild.thresholds.length < this.maxDegree) {
            BNode1.thresholds = BNode1.thresholds.concat(BNode2.thresholds);
            BNode1.datas = BNode1.datas.concat(BNode2.datas);
            BNode2.children.shift();
            BNode1.children = BNode1.children.concat(BNode2.children);
            this.mergeBNodes(leftChild, rightChild);
            return;
        }
        //Case 2: We can just rotate
        else {
            //Case 2.a: Left child has more entries
            if (leftChild.thresholds.length > rightChild.thresholds.length) {
                var indexToPromote = leftChild.thresholds.length - 1;
                var keyToPromote = leftChild.thresholds[indexToPromote];
                var dataToPromote = leftChild.datas[indexToPromote];
                leftChild.delete_wrapper(keyToPromote, indexToPromote);
                BNode1.thresholds.push(keyToPromote);
                BNode1.datas.push(dataToPromote);
                BNode1.thresholds = BNode1.thresholds.concat(BNode2.thresholds);
                BNode1.datas = BNode1.datas.concat(BNode2.datas);
                BNode1.children = BNode1.children.concat(BNode2.children);
            }
            //Case 2.b: Right child has more (or equal) entries
            else {
                var indexToPromote = 0;
                var keyToPromote = rightChild.thresholds[indexToPromote];
                var dataToPromote = rightChild.datas[indexToPromote];
                rightChild.delete_wrapper(keyToPromote, indexToPromote);
                BNode1.thresholds.push(keyToPromote);
                BNode1.datas.push(dataToPromote);
                BNode1.thresholds = BNode1.thresholds.concat(BNode2.thresholds);
                BNode1.datas = BNode1.datas.concat(BNode2.datas);
                BNode1.children = BNode1.children.concat(BNode2.children);
            }
            return;
        }
    };
    BNode.prototype.balance = function (changedBNode) {
        var curNbBNodes = this.thresholds.length;
        //If the number of BNodes here are smaller than half the max amount, then we have to compress
        if (curNbBNodes <= this.maxDegree / 2) {
        }
    };
    BNode.prototype.validate_self = function () {
        //Validate lengths
        if (this.datas.length !== this.thresholds.length) {
            throw new Error("Datas and Threshold lengths are inconsistent");
        }
        if (this.children.length !== 0 && this.datas.length !== (this.children.length - 1)) {
            throw new Error("Children lengths are inconsistent");
        }
        //Validate ordering
        for (var i = 0; i < this.thresholds.length - 1; i++) {
            if (this.thresholds[i] >= this.thresholds[i + 1]) {
                throw new Error("Threshold orderings are wrong");
            }
        }
    };
    BNode.prototype.validate_up = function () {
        if (typeof this.parent === "undefined") {
            return this.validate_down();
        }
        return this.parent.validate_up();
    };
    BNode.prototype.validate_down = function () {
        this.validate_self();
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (typeof child.parent === "undefined") {
                throw new Error("Root's children's parent is unitialized");
            }
            if (child.parent !== this) {
                throw new Error("Root's children are not correctly representing the root as parent");
            }
            child.validate_down();
        }
    };
    BNode.prototype.print_tree = function () {
        return this.print_tree_up();
    };
    BNode.prototype.print_tree_up = function () {
        if (typeof this.parent != "undefined") {
            return this.parent.print_tree_up();
        }
        this.print_tree_down(0);
        console.log("");
    };
    BNode.prototype.print_tree_down = function (cur_level) {
        if (cur_level === 0) {
            console.log('// ' + this.thresholds);
        }
        else if (cur_level === 1) {
            console.log("// |".concat('────'.repeat(cur_level), " ").concat(this.thresholds));
        }
        else {
            console.log("// |".concat('    '.repeat(cur_level - 1), " |\u2500\u2500\u2500\u2500 ").concat(this.thresholds));
        }
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.print_tree_down(cur_level + 1);
        }
    };
    return BNode;
}());
function insertionTest001() {
    var cur = new BNode(undefined, 5);
    for (var i = 0; i <= 100; i += 5) {
        cur.insert_child_up(i, "hi");
    }
    for (var i = 1; i <= 100; i += 5) {
        cur.insert_child_up(i, "hi");
    }
    for (var i = 2; i <= 100; i += 5) {
        cur.insert_child_up(i, "hi");
    }
    for (var i = 3; i <= 100; i += 5) {
        cur.insert_child_up(i, "hi");
    }
    for (var i = 4; i <= 100; i += 5) {
        cur.insert_child_up(i, "hi");
    }
    cur.print_tree();
    cur.validate_up();
}
function insertionTest002() {
    var cur = new BNode(undefined, 5);
    for (var i = 0; i <= 100; i++) {
        cur.insert_child_up(i, "hi");
    }
    cur.print_tree();
    cur.validate_up();
}
function insertionTest003() {
    var cur = new BNode(undefined, 5);
    for (var i = 100; i >= 0; i--) {
        cur.insert_child_up(i, "hi");
    }
    cur.print_tree();
    cur.validate_up();
}
insertionTest003();
