export const MAX_DEGREE = 6;
export const LAST_INDEX = 1;
export const SERVER_BRANCHES_NUM = 63;

// sim setup 
export const SIM_TICK = 500; // in ms
export const INITIAL_NODE_ID = 0;
export const INITIAL_NODE_NUMBER = 25;
export const STATS_WINDOW = 100;

// probability calculation of the transaction and delete number of action
export const ADDING_USER_PROBABILITY = 35;
export const DELETE_USER_PROBABILITY = 25;
export const TRANSACTION_PROBABILITY = 30;

export const SERVER_ID : number = -99;
export const MIN_BUBBLE_UP_WAIT_TIME:number = 150;   // How long(ms) does each node wait for more transactions before bubbleling up
export const MIN_TRANSACTION_WAIT_TIME:number = 6; // How long(ms) does each node wait before sending the data to his parent (applies after bubble up wait time)
export const MAX_BUBBLE_UP_WAIT_TIME:number = 250;   // How long(ms) does each node wait for more transactions before bubbleling up
export const MAX_TRANSACTION_WAIT_TIME:number = 36; // How long(ms) does each node wait before sending the data to his parent (applies after bubble up wait time)

