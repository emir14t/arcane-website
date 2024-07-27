"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Testing = exports.BNode = exports.User = exports.TRANSACTION_WAIT_TIME = exports.BUBBLE_UP_WAIT_TIME = void 0;
// import { Node,Transaction } from "src/app/interface/interface";
var async_mutex_1 = require("async-mutex");
exports.BUBBLE_UP_WAIT_TIME = 500; // How long(ms) does each node wait for more transactions before bubbleling up
exports.TRANSACTION_WAIT_TIME = 30; // How long(ms) does each node wait before sending the data to his parent (applies after bubble up wait time)
function process_transactions(transactions) {
    var output = [];
    transactions.forEach(function (t) {
        output.push("transaction : w => ".concat(t.reads.toString(), ", r => ").concat(t.writes.toString()));
    });
    // console.log(output.toString());
}
var User = /** @class */ (function () {
    function User() {
    }
    return User;
}());
exports.User = User;
var BNode = /** @class */ (function () {
    // Constructor
    function BNode(parent, maxNumberOfThresholds) {
        this.children = [];
        this.thresholds = new Array();
        this.datas = new Array();
        this.maxNumberOfThresholds = -1;
        this.minNumberOfThresholds = -1;
        // Transactions
        this.my_lock = new async_mutex_1.Mutex();
        this.all_cur_transactions = [];
        //Initialization
        if (maxNumberOfThresholds < 2) {
            throw new Error("Disallowed initialization");
        }
        this.parent = parent;
        this.maxNumberOfThresholds = maxNumberOfThresholds;
        this.minNumberOfThresholds = Math.floor((maxNumberOfThresholds) / 2);
    }
    //Signals
    BNode.prototype.transaction_is_arriving = function (id) {
        // this.transactionService.transactionIsArriving(id);
    };
    BNode.prototype.transaction_is_leaving = function (id) {
        // this.transactionService.transactionIsLeaving(id);
    };
    BNode.prototype.create_transaction = function (transaction) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this._data_collection([transaction]);
                return [2 /*return*/];
            });
        });
    };
    BNode.prototype._data_collection = function (transactions) {
        return __awaiter(this, void 0, void 0, function () {
            var im_collecting;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.transaction_is_arriving(this.thresholds[0]);
                        return [4 /*yield*/, this.my_lock.acquire()];
                    case 1:
                        _b.sent();
                        try {
                            im_collecting = (this.all_cur_transactions.length === 0);
                            (_a = this.all_cur_transactions).push.apply(_a, transactions);
                            if (im_collecting) {
                                setTimeout(this._bubble_up.bind(this), exports.BUBBLE_UP_WAIT_TIME);
                            }
                        }
                        finally {
                            this.my_lock.release();
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    BNode.prototype._bubble_up = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.transaction_is_leaving(this.thresholds[0]);
                        return [4 /*yield*/, this.my_lock.acquire()];
                    case 1:
                        _a.sent();
                        try {
                            if (typeof this.parent === "undefined") {
                                setTimeout(process_transactions.bind(this), exports.TRANSACTION_WAIT_TIME, this.all_cur_transactions);
                            }
                            else {
                                setTimeout(this.parent._data_collection.bind(this), exports.TRANSACTION_WAIT_TIME, this.all_cur_transactions);
                            }
                            this.all_cur_transactions = [];
                        }
                        finally {
                            this.my_lock.release();
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // Search algorithm (returns the Data associated with the userID if it exists and undefined if the userID doesn't exist)
    BNode.prototype.search = function (userID) {
        return this._search_up(userID);
    };
    BNode.prototype._search_down = function (userID) {
        //Base case (leaf)
        if (this.children.length === 0) {
            for (var index = 0; index < this.thresholds.length; index++) {
                if (userID === this.thresholds[index]) {
                    return this;
                }
            }
            return undefined;
        }
        //Iterate over the thresholds to find where the data is
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                return this.children[index]._search_down(userID);
            }
            else if (userID === threshold) {
                return this;
            }
        }
        return this.children[this.children.length - 1]._search_down(userID);
    };
    BNode.prototype._search_up = function (userID) {
        //Base case (root)
        if (typeof this.parent === "undefined") {
            return this._search_down(userID);
        }
        //Iterate over the thresholds to find where the data could be
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                if (index === 0) {
                    return this.parent._search_up(userID);
                }
                if (this.children.length === 0) {
                    return this._search_down(userID);
                }
                return this.children[index]._search_down(userID);
            }
            else if (userID === threshold) {
                return this;
            }
        }
        return this.parent._search_up(userID);
    };
    // Insertion algorithm (returns a BNode<Data> that contains the user you added)
    BNode.prototype.insert_child = function (userID, data) {
        return this._insert_child_up(userID, data);
    };
    BNode.prototype._insert_child_down = function (userID, data) {
        //Base case (leaf)
        if (this.children.length === 0) {
            return this._add_data_to_node(userID, data);
        }
        //Iterate over the thresholds to find where the data is
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                return this.children[index]._insert_child_down(userID, data);
            }
            else if (userID === threshold) {
                throw new Error("Cannot add same user twice to the tree");
            }
        }
        return this.children[this.children.length - 1]._insert_child_down(userID, data);
    };
    BNode.prototype._insert_child_up = function (userID, data) {
        //Base case (root)
        if (typeof this.parent === "undefined") {
            return this._insert_child_down(userID, data);
        }
        //Iterate over the thresholds to find where the data could be
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                if (index === 0) {
                    return this.parent._insert_child_up(userID, data);
                }
                if (this.children.length === 0) {
                    return this._add_data_to_node(userID, data);
                }
                return this.children[index]._insert_child_down(userID, data);
            }
            else if (userID === threshold) {
                throw new Error("Cannot add same user twice to the tree");
            }
        }
        return this.parent._insert_child_up(userID, data);
    };
    BNode.prototype._add_data_to_node = function (userID, data) {
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
        if (this.thresholds.length > this.maxNumberOfThresholds) {
            if (!this.thresholds.includes(userID)) {
                throw new Error("Threshold doesn't show that we've added the user");
            }
            return this._split_node_wrapper(userID);
        }
        return this;
    };
    BNode.prototype._split_node_wrapper = function (userID) {
        //This handles the edge cases before asking parent to split this BNode
        if (typeof this.parent === "undefined") {
            var tmpParent = new BNode(undefined, this.maxNumberOfThresholds); //, this.transactionService
            tmpParent.children.push(this);
            this.parent = tmpParent;
            return tmpParent._split_node(userID, this);
        }
        return this.parent._split_node(userID, this);
    };
    BNode.prototype._split_node = function (userID, childBNode) {
        //Assuming that childBNode.parent === this
        var newBNode = new BNode(this, this.maxNumberOfThresholds); //, this.transactionService
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
        else {
            if (keyToPromote < this.thresholds[0]) {
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
        }
        //Check if we have to split
        if (this.thresholds.length > this.maxNumberOfThresholds) {
            var ans = this._split_node_wrapper(userID);
            if (newBNode.thresholds.includes(userID)) {
                return newBNode;
            }
            else if (childBNode.thresholds.includes(userID)) {
                return childBNode;
            }
            else {
                return ans;
            }
        }
        else {
            if (keyToPromote === userID) {
                return this;
            }
            else if (newBNode.thresholds.includes(userID)) {
                return newBNode;
            }
            else if (childBNode.thresholds.includes(userID)) {
                return childBNode;
            }
            else {
                return undefined;
            }
        }
    };
    BNode.prototype._split_node_wrapper_nr = function () {
        //This handles the edge cases before asking parent to split this BNode
        if (typeof this.parent === "undefined") {
            var tmpParent = new BNode(undefined, this.maxNumberOfThresholds); //, this.transactionService
            tmpParent.children.push(this);
            this.parent = tmpParent;
            return tmpParent._split_node_nr(this);
        }
        return this.parent._split_node_nr(this);
    };
    BNode.prototype._split_node_nr = function (childBNode) {
        //Assuming that childBNode.parent === this
        var newBNode = new BNode(this, this.maxNumberOfThresholds); //, this.transactionService
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
        else {
            if (keyToPromote < this.thresholds[0]) {
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
        }
        //Check if we have to split
        if (this.thresholds.length > this.maxNumberOfThresholds) {
            this._split_node_wrapper_nr();
        }
    };
    // Deletion algorithm (returns a valid BNode<Data>)
    BNode.prototype.delete = function (userID) {
        return this._delete_up(userID);
    };
    BNode.prototype._delete_down = function (userID) {
        //Base case (leaf)
        if (this.children.length === 0) {
            for (var index = 0; index < this.thresholds.length; index++) {
                if (userID === this.thresholds[index]) {
                    return this._delete_wrapper(index);
                }
            }
            throw new Error("Node not found");
        }
        //Iterate over the thresholds to find where the data is
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                return this.children[index]._delete_down(userID);
            }
            else if (userID === threshold) {
                return this._delete_wrapper(index);
            }
        }
        return this.children[this.children.length - 1]._delete_down(userID);
    };
    BNode.prototype._delete_up = function (userID) {
        //Base case (root)
        if (typeof this.parent === "undefined") {
            return this._delete_down(userID);
        }
        //Iterate over the thresholds to find where the data could be
        for (var index = 0; index < this.thresholds.length; index++) {
            var threshold = this.thresholds[index];
            if (userID < threshold) {
                if (index === 0) {
                    return this.parent._delete_up(userID);
                }
                if (this.children.length === 0) {
                    throw new Error("Node not found");
                }
                return this.children[index]._delete_down(userID);
            }
            else if (userID === threshold) {
                return this._delete_wrapper(index);
            }
        }
        return this.parent._delete_up(userID);
    };
    BNode.prototype._delete_wrapper = function (index) {
        //Assuming that userID is present in this.children
        //Case 1: Leaf
        if (this.children.length === 0) {
            return this._leaf_handler(index);
        }
        return this._internal_handler(index);
    };
    BNode.prototype._leaf_handler = function (index) {
        this.datas.splice(index, 1);
        this.thresholds.splice(index, 1);
        if (this.datas.length < this.minNumberOfThresholds) {
            if (typeof this.parent == "undefined") {
                return this;
            }
            return this.parent._balance_tree(this);
        }
        return this;
    };
    BNode.prototype._internal_handler = function (index) {
        var leftChild = this.children[index];
        var rightChild = this.children[index + 1];
        //Case 2.b: Rotation
        //Case 2.ba: Left child has more entries
        var childToDeleteFrom = this._can_promote_left(leftChild);
        if (typeof childToDeleteFrom !== "undefined") {
            var indexToRem = childToDeleteFrom.thresholds.length - 1;
            var thresholdToRem = childToDeleteFrom.thresholds[indexToRem];
            var dataToRem = childToDeleteFrom.datas[indexToRem];
            childToDeleteFrom._delete_wrapper(indexToRem);
            this.thresholds[index] = thresholdToRem;
            this.datas[index] = dataToRem;
            return this._should_balance_tree();
        }
        //Case 2.bb: Right child has more (or equal) entries
        childToDeleteFrom = this._can_promote_right(rightChild);
        if (typeof childToDeleteFrom !== "undefined") {
            var thresholdToRem = childToDeleteFrom.thresholds[0];
            var dataToRem = childToDeleteFrom.datas[0];
            childToDeleteFrom._delete_wrapper(0);
            this.thresholds[index] = thresholdToRem;
            this.datas[index] = dataToRem;
            return this._should_balance_tree();
        }
        //Case 2.a: Compression
        if (leftChild.thresholds.length + rightChild.thresholds.length <= this.maxNumberOfThresholds) {
            this.children.splice(index + 1, 1);
            this.datas.splice(index, 1);
            this.thresholds.splice(index, 1);
            this._naive_merge(leftChild, rightChild);
            return this._should_balance_tree();
        }
        throw new Error("Unresolved here");
    };
    BNode.prototype._can_promote_left = function (leftChild) {
        var childToDeleteFrom = leftChild;
        var possible = false;
        while (childToDeleteFrom.children.length !== 0) {
            if (childToDeleteFrom.thresholds.length > this.minNumberOfThresholds) {
                possible = true;
            }
            childToDeleteFrom = childToDeleteFrom.children[childToDeleteFrom.children.length - 1];
        }
        if (childToDeleteFrom.thresholds.length > this.minNumberOfThresholds) {
            possible = true;
        }
        if (possible) {
            return childToDeleteFrom;
        }
        return undefined;
    };
    BNode.prototype._can_promote_right = function (rightChild) {
        var childToDeleteFrom = rightChild;
        var possible = false;
        while (childToDeleteFrom.children.length !== 0) {
            if (childToDeleteFrom.thresholds.length > this.minNumberOfThresholds) {
                possible = true;
            }
            childToDeleteFrom = childToDeleteFrom.children[0];
        }
        if (childToDeleteFrom.thresholds.length > this.minNumberOfThresholds) {
            possible = true;
        }
        if (possible) {
            return childToDeleteFrom;
        }
        return undefined;
    };
    BNode.prototype._should_balance_tree = function () {
        if (this.datas.length < this.minNumberOfThresholds) {
            if (typeof this.parent == "undefined") {
                return this;
            }
            return this.parent._balance_tree(this);
        }
        return this;
    };
    BNode.prototype._naive_merge = function (BNode1, BNode2) {
        var _a, _b, _c, _d, _e;
        if (BNode1.children.length === 0) {
            (_a = BNode1.datas).push.apply(_a, BNode2.datas);
            (_b = BNode1.thresholds).push.apply(_b, BNode2.thresholds);
            return;
        }
        var left = BNode1.children[BNode1.children.length - 1];
        var right = BNode2.children.shift();
        (_c = BNode1.datas).push.apply(_c, BNode2.datas);
        (_d = BNode1.thresholds).push.apply(_d, BNode2.thresholds);
        (_e = BNode1.children).push.apply(_e, BNode2.children);
        for (var _i = 0, _f = BNode2.children; _i < _f.length; _i++) {
            var child = _f[_i];
            child.parent = BNode1;
        }
        this._naive_merge(left, right);
    };
    BNode.prototype._balance_tree = function (changedBNode) {
        // Making sure that we need to do this
        if (changedBNode.thresholds.length >= this.minNumberOfThresholds) {
            return this;
        }
        //Finding the index
        var index = this.get_index_of(changedBNode);
        // See if we can compress the entire thing
        if (this._can_compress_all()) {
            return this._compress_all_children_into_me();
        }
        // Case 2: Rotate
        // If left child exists
        var tmp_ret = this._try_rotate_left(index);
        if (typeof tmp_ret !== "undefined") {
            return tmp_ret;
        }
        // If the right child exists
        tmp_ret = this._try_rotate_right(index);
        if (typeof tmp_ret !== "undefined") {
            return tmp_ret;
        }
        // Case 1: Compress
        // If the left child exists
        tmp_ret = this._try_compress_left(index);
        if (typeof tmp_ret !== "undefined") {
            return tmp_ret;
        }
        // If the right child exists
        tmp_ret = this._try_compress_right(index);
        if (typeof tmp_ret !== "undefined") {
            return tmp_ret;
        }
        throw new Error("Balancing failed");
    };
    BNode.prototype._can_compress_all = function () {
        var total = this.thresholds.length;
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            total += child.thresholds.length;
        }
        return (total <= this.maxNumberOfThresholds);
    };
    BNode.prototype._compress_all_children_into_me = function () {
        var _a, _b, _c;
        var iter = this.thresholds.length;
        for (var i = iter; i >= 0; i--) {
            (_a = this.thresholds).splice.apply(_a, __spreadArray([i, 0], this.children[i].thresholds, false));
            (_b = this.datas).splice.apply(_b, __spreadArray([i, 0], this.children[i].datas, false));
        }
        var tmpChildren = this.children;
        this.children = [];
        for (var _i = 0, tmpChildren_1 = tmpChildren; _i < tmpChildren_1.length; _i++) {
            var child = tmpChildren_1[_i];
            (_c = this.children).push.apply(_c, child.children);
        }
        for (var _d = 0, _e = this.children; _d < _e.length; _d++) {
            var child = _e[_d];
            child.parent = this;
        }
        if (typeof this.parent !== "undefined") {
            return this.parent._balance_tree(this);
        }
        return this;
    };
    BNode.prototype._try_rotate_left = function (index) {
        if (index - 1 >= 0) {
            var child = this.children[index - 1];
            var child2 = this.children[index];
            if (child.thresholds.length > this.minNumberOfThresholds) {
                var tmpIndex = child.thresholds.length - 1;
                var tmpKey = child.thresholds[tmpIndex];
                var tmpData = child.datas[tmpIndex];
                child.thresholds.pop();
                child.datas.pop();
                if (child.children.length !== 0) {
                    var tmpChild = child.children[tmpIndex + 1];
                    child.children.pop();
                    child2.children.unshift(tmpChild);
                    tmpChild.parent = child2;
                }
                var tmpKey1 = this.thresholds[index - 1];
                var tmpData1 = this.datas[index - 1];
                this.thresholds[index - 1] = tmpKey;
                this.datas[index - 1] = tmpData;
                child2.thresholds.unshift(tmpKey1);
                child2.datas.unshift(tmpData1);
                return this;
            }
        }
        return undefined;
    };
    BNode.prototype._try_rotate_right = function (index) {
        if (index + 1 < this.children.length) {
            var child = this.children[index + 1];
            var child2 = this.children[index];
            if (child.thresholds.length > this.minNumberOfThresholds) {
                var tmpKey = child.thresholds[0];
                var tmpData = child.datas[0];
                child.thresholds.shift();
                child.datas.shift();
                if (child.children.length !== 0) {
                    var tmpChild = child.children[0];
                    child.children.shift();
                    child2.children.push(tmpChild);
                    tmpChild.parent = child2;
                }
                var tmpKey1 = this.thresholds[index];
                var tmpData1 = this.datas[index];
                this.thresholds[index] = tmpKey;
                this.datas[index] = tmpData;
                child2.thresholds.push(tmpKey1);
                child2.datas.push(tmpData1);
                return this;
            }
        }
        return undefined;
    };
    BNode.prototype._try_compress_right = function (index) {
        var _a, _b, _c;
        if (index - 1 >= 0) {
            if (this.children[index - 1].thresholds.length + this.children[index].thresholds.length < this.maxNumberOfThresholds) {
                var child = this.children[index - 1];
                var child2 = this.children.splice(index, 1)[0];
                var tmpKey = this.thresholds.splice(index - 1, 1)[0];
                var tmpData = this.datas.splice(index - 1, 1)[0];
                (_a = child.thresholds).push.apply(_a, __spreadArray([tmpKey], child2.thresholds, false));
                (_b = child.datas).push.apply(_b, __spreadArray([tmpData], child2.datas, false));
                (_c = child.children).push.apply(_c, child2.children);
                for (var _i = 0, _d = child.children; _i < _d.length; _i++) {
                    var tmpChild = _d[_i];
                    tmpChild.parent = child;
                }
                this._balance_tree(this.children[index - 1]);
                if (typeof this.parent !== "undefined") {
                    return this.parent._balance_tree(this);
                }
                return this;
            }
        }
        return undefined;
    };
    BNode.prototype._try_compress_left = function (index) {
        var _a, _b, _c;
        if (index + 1 < this.children.length) {
            if (this.children[index].thresholds.length + this.children[index + 1].thresholds.length < this.maxNumberOfThresholds) {
                var child = this.children[index];
                var child2 = this.children.splice(index + 1, 1)[0];
                var tmpKey = this.thresholds.splice(index, 1)[0];
                var tmpData = this.datas.splice(index, 1)[0];
                (_a = child.thresholds).push.apply(_a, __spreadArray([tmpKey], child2.thresholds, false));
                (_b = child.datas).push.apply(_b, __spreadArray([tmpData], child2.datas, false));
                (_c = child.children).push.apply(_c, child2.children);
                for (var _i = 0, _d = child.children; _i < _d.length; _i++) {
                    var tmpChild = _d[_i];
                    tmpChild.parent = child;
                }
                this._balance_tree(this.children[index]);
                if (typeof this.parent !== "undefined") {
                    return this.parent._balance_tree(this);
                }
                return this;
            }
        }
        return undefined;
    };
    // Validation algorithm (checks the integrety of the BTree)
    BNode.prototype.validate_tree = function () {
        this._validate_up();
    };
    BNode.prototype._validate_self = function (minNumb, maxNumb) {
        //Validate lengths
        if (this.datas.length !== this.thresholds.length) {
            throw new Error("Datas and Threshold lengths are inconsistent");
        }
        if (this.children.length !== 0 && this.datas.length !== (this.children.length - 1)) {
            throw new Error("Children lengths are inconsistent");
        }
        if (typeof this.parent !== "undefined" && this.datas.length < this.minNumberOfThresholds) {
            throw new Error("Tree has nodes with less than the minimum amount of nodes ");
        }
        if (this.datas.length > this.maxNumberOfThresholds) {
            throw new Error("Tree has nodes with more than the maximum amount of nodes ");
        }
        //Validate ordering
        for (var i = 0; i < this.thresholds.length - 1; i++) {
            if (this.thresholds[i] >= this.thresholds[i + 1]) {
                throw new Error("Threshold orderings are wrong");
            }
        }
        //Validate order of data
        if (this.thresholds[0] < minNumb) {
            throw new Error("Thresholds in current node do not respect the min");
        }
        if (this.thresholds[this.thresholds.length - 1] > maxNumb) {
            throw new Error("Thresholds in current node do not respect the max");
        }
    };
    BNode.prototype._validate_up = function () {
        if (typeof this.parent === "undefined") {
            return this._validate_down(-Infinity, Infinity);
        }
        return this.parent._validate_up();
    };
    BNode.prototype._validate_down = function (minNumb, maxNumb) {
        this._validate_self(minNumb, maxNumb);
        for (var index = 0; index < this.children.length; index++) {
            var child = this.children[index];
            if (typeof child.parent === "undefined") {
                throw new Error("Children's parent is unitialized");
            }
            if (child.parent !== this) {
                throw new Error("Childrens are not correctly representing their parent as parent");
            }
            var curMin = minNumb;
            var curMax = maxNumb;
            if (index === 0) {
                curMax = this.thresholds[0];
            }
            else if (index === this.children.length - 1) {
                curMin = this.thresholds[index - 1];
            }
            else {
                curMin = this.thresholds[index - 1];
                curMax = this.thresholds[index];
            }
            child._validate_down(curMin, curMax);
        }
    };
    // Print the tree
    BNode.prototype.print_tree = function () {
        return this._print_tree_up();
    };
    BNode.prototype._print_tree_up = function () {
        if (typeof this.parent != "undefined") {
            return this.parent._print_tree_up();
        }
        this._print_tree_down(0);
        console.log("");
    };
    BNode.prototype._print_tree_down = function (cur_level) {
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
            child._print_tree_down(cur_level + 1);
        }
    };
    // BNode tree to Map (converts a BNode tree to a map)
    BNode.prototype.bnode_tree_to_node_map = function () {
        if (typeof this.parent === "undefined") {
            return this._bnode_tree_to_node_map_down(this);
        }
        return this.parent.bnode_tree_to_node_map();
    };
    BNode.prototype._bnode_tree_to_node_map_down = function (root) {
        var queue1 = [root];
        var queue2 = [];
        var turnstile = true;
        var depth = 0;
        var breadth = 0;
        var curID = 1;
        var retMap = new Map();
        var helpMap = new Map();
        helpMap.set(root.thresholds[0], 0);
        while (queue1.length !== 0 || queue2.length !== 0) {
            if (turnstile) {
                for (var i = 0; i < queue1.length; i++) {
                    var node = queue1[i];
                    var children = [];
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        helpMap.set(child.thresholds[0], curID);
                        children.push(curID);
                        queue2.push(child);
                        curID++;
                    }
                    var id = helpMap.get(node.thresholds[0]);
                    var parent_1 = typeof node.parent === "undefined" ? null : helpMap.get(node.parent.thresholds[0]);
                    retMap.set(id, { id: id, value: node.thresholds.toString(), depth: depth, breadth: breadth, parent: parent_1 });
                    breadth++;
                }
                queue1 = [];
            }
            else {
                for (var i = 0; i < queue2.length; i++) {
                    var node = queue2[i];
                    var children = [];
                    for (var _b = 0, _c = node.children; _b < _c.length; _b++) {
                        var child = _c[_b];
                        helpMap.set(child.thresholds[0], curID);
                        children.push(curID);
                        queue1.push(child);
                        curID++;
                    }
                    var id = helpMap.get(node.thresholds[0]);
                    var parent_2 = typeof node.parent === "undefined" ? null : helpMap.get(node.parent.thresholds[0]);
                    retMap.set(id, { id: id, value: node.thresholds.toString(), depth: depth, breadth: breadth, parent: parent_2 });
                    breadth++;
                }
                queue2 = [];
            }
            depth++;
            breadth = 0;
            turnstile = !turnstile;
        }
        return retMap;
    };
    // Helpers
    BNode.prototype.has = function (userID) {
        return this.thresholds.includes(userID);
    };
    BNode.prototype.get_index_of = function (child) {
        var index = 0;
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var mychild = _a[_i];
            if (child === mychild) {
                return index;
            }
            index++;
        }
        throw new Error("Could not find the child");
    };
    return BNode;
}());
exports.BNode = BNode;
var Testing = /** @class */ (function () {
    function Testing() {
    }
    Testing.prototype.allTests = function () {
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
    };
    Testing.prototype.insertionTest001 = function () {
        var cur = new BNode(undefined, 5);
        for (var i = 0; i <= 100; i += 5) {
            cur = cur.insert_child(i, ["hi"]);
        }
        for (var i = 1; i <= 100; i += 5) {
            cur = cur.insert_child(i, ["hi"]);
        }
        for (var i = 2; i <= 100; i += 5) {
            cur = cur.insert_child(i, ["hi"]);
        }
        for (var i = 3; i <= 100; i += 5) {
            cur = cur.insert_child(i, ["hi"]);
        }
        for (var i = 4; i <= 100; i += 5) {
            cur = cur.insert_child(i, ["hi"]);
        }
        cur.validate_tree();
    };
    Testing.prototype.insertionTest002 = function () {
        var cur = new BNode(undefined, 5);
        for (var i = 0; i <= 100; i++) {
            cur = cur.insert_child(i, ["hi"]);
        }
        cur.validate_tree();
    };
    Testing.prototype.insertionTest003 = function () {
        var cur = new BNode(undefined, 6);
        for (var i = 100; i >= 0; i--) {
            cur = cur.insert_child(i, ["hi"]);
        }
        cur.validate_tree();
    };
    Testing.prototype.insertionTest004 = function () {
        var cur = new BNode(undefined, 5);
        for (var i = 0; i <= 100; i++) {
            cur = cur.insert_child(i, ["hi"]);
            if (!cur.has(i)) {
                throw new Error("Output isnt correct");
            }
        }
    };
    Testing.prototype.searchTest001 = function () {
        var cur = new BNode(undefined, 5);
        for (var i = 0; i <= 100; i += 5) {
            cur.insert_child(i, ["hi"]);
        }
        for (var i = 1; i <= 100; i += 5) {
            cur.insert_child(i, ["hi"]);
        }
        for (var i = 2; i <= 100; i += 5) {
            cur.insert_child(i, ["hi"]);
        }
        for (var i = 3; i <= 100; i += 5) {
            cur.insert_child(i, ["hi"]);
        }
        for (var i = 4; i <= 100; i += 5) {
            cur.insert_child(i, ["hi"]);
        }
        for (var i = 0; i <= 100; i++) {
            if (!cur.search(i).has(i)) {
                throw new Error("Problem with the search");
            }
        }
        for (var i = 101; i <= 200; i++) {
            if (typeof cur.search(i) !== "undefined") {
                throw new Error("Problem with the search");
            }
        }
    };
    Testing.prototype.deleteTest001 = function () {
        var cur = new BNode(undefined, 5);
        for (var i = 0; i <= 1000; i++) {
            cur.insert_child(i, ["hi"]);
        }
        // cur.print_tree();
        cur.validate_tree();
        for (var i = 0; i <= 1000; i++) {
            cur = cur.delete(i);
            // root.print_tree();
            cur.validate_tree();
        }
    };
    Testing.prototype.deleteTest002 = function () {
        var cur = new BNode(undefined, 5);
        var leap = 5;
        var max = 1000;
        for (var j = 0; j < leap; j++) {
            for (var i = j; i <= max; i += leap) {
                cur.insert_child(i, ["hi"]);
            }
        }
        cur.validate_tree();
        for (var j = 0; j < leap; j++) {
            for (var i = j; i <= max; i += leap) {
                // console.log("Deleting " + i);
                cur = cur.delete(i);
                // cur.print_tree();
                cur.validate_tree();
            }
        }
    };
    Testing.prototype.deleteTest003 = function () {
        var cur = new BNode(undefined, 5);
        var leap = 5;
        var max = 1000;
        for (var j = 0; j < leap; j++) {
            for (var i = j; i <= max; i += leap) {
                cur.insert_child(i, ["hi"]);
            }
        }
        cur.validate_tree();
        for (var j = 0; j < leap; j++) {
            for (var i = j; i <= max; i += leap) {
                // console.log("Deleting " + i);
                cur = cur.delete(i);
                // cur.print_tree();
                cur.validate_tree();
            }
        }
        for (var j = 0; j < leap; j++) {
            for (var i = j; i <= max; i += leap) {
                cur.insert_child(i, ["hi"]);
            }
            for (var i = j; i <= max; i += leap) {
                // console.log("Deleting " + i);
                cur = cur.delete(i);
                // root.print_tree();
                cur.validate_tree();
            }
        }
    };
    Testing.prototype.deleteTest004 = function () {
        var set = [];
        var cur = new BNode(undefined, 6);
        var empty_all = false;
        for (var i = 0; i < 20000; i++) {
            if (set.length === 0) {
                empty_all = false;
            }
            if (empty_all === true) {
                var random_index = Math.floor(Math.random() * set.length);
                cur = cur.delete(set[random_index]);
                set.splice(random_index, 1);
                continue;
            }
            if (set.length > 1000) {
                empty_all = true;
                console.log("Emptying");
                continue;
            }
            else if (set.length < 2) {
                var random_number = Math.floor(Math.random() * 100000);
                while (set.includes(random_number)) {
                    random_number = Math.floor(Math.random() * 100000);
                }
                cur.insert_child(random_number, "hi");
                set.push(random_number);
            }
            else {
                if (Math.random() < 0.55) {
                    var random_number = Math.floor(Math.random() * 100000);
                    while (set.includes(random_number)) {
                        random_number = Math.floor(Math.random() * 100000);
                    }
                    cur.insert_child(random_number, "hi");
                    set.push(random_number);
                }
                else {
                    var random_index = Math.floor(Math.random() * set.length);
                    cur = cur.delete(set[random_index]);
                    set.splice(random_index, 1);
                }
            }
            // cur.print_tree()
            cur.validate_tree();
            // console.log(set.length)
        }
        // console.log(set.length)
        // cur.print_tree()
    };
    Testing.prototype.test_bnode_tree_to_node_map = function () {
        var cur = new BNode(undefined, 5);
        for (var i = 0; i <= 100; i++) {
            cur.insert_child(i, ["hi"]);
        }
        cur.print_tree();
        console.log(cur.bnode_tree_to_node_map());
    };
    Testing.prototype.test_async = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cur, i;
            return __generator(this, function (_a) {
                cur = new BNode(undefined, 4);
                for (i = 0; i < 100; i++) {
                    cur.create_transaction({ writes: [i], reads: [i] });
                }
                return [2 /*return*/];
            });
        });
    };
    return Testing;
}());
exports.Testing = Testing;
var t = new Testing();
t.allTests();
