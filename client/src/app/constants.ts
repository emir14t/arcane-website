export const MAX_DEGREE = 6;
export const LAST_INDEX = 1;
export const SERVER_BRANCHES_NUM = 63;

export const INITIAL_NODE_ID = 0;
export const INITIAL_NODE_NUMBER = 100;
export const PROBABILITY_OF_ADDING_USER = 75;
export const STATS_WINDOW = 100;

// probability calculation of the transaction and delete number of action
export const ACTIONS_NUMBERS = 11; // should be a prime number to have a finite action field
export const TX_ACTION_NUMBERS = 4;
export const DELETE_ACTION_NUMBERS = 1;
export const ADD_ACTION_NUMBERS = 2;

export const SERVER_ID : number = -99;
export const MIN_BUBBLE_UP_WAIT_TIME:number = 0;   // How long(ms) does each node wait for more transactions before bubbleling up
export const MIN_TRANSACTION_WAIT_TIME:number = 0; // How long(ms) does each node wait before sending the data to his parent (applies after bubble up wait time)
export const MAX_BUBBLE_UP_WAIT_TIME:number = 0;   // How long(ms) does each node wait for more transactions before bubbleling up
export const MAX_TRANSACTION_WAIT_TIME:number = 0; // How long(ms) does each node wait before sending the data to his parent (applies after bubble up wait time)

