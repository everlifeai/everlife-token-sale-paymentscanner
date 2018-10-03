/**
 * Handle addition of duplicate ID
 */
let duplicate = 
{ 
    CPCI0ZL1HQTVVK33DZMDFMD8BM: 
    {   error: 'ok',
        time_created: 1537710923,
        time_expires: 1537721723,
        status: 100,
        status_text: 'Complete',
        type: 'coins',
        coin: 'BTC',
        amount: 8000,
        amountf: '0.00008000',
        received: 8000,
        receivedf: '0.00008000',
        recv_confirms: 2,
        payment_address: '3LNh8tnnBpoYYxQkx6zU3hxT2o9zBHQVbh',
        time_completed: 1537712941 
    },
    CPCI0ZL1HQTVVK33DZMDFMD8BM: 
    {   error: 'ok',
        time_created: 1537710923,
        time_expires: 1537721723,
        status: 100,
        status_text: 'Complete',
        type: 'coins',
        coin: 'BTC',
        amount: 8000,
        amountf: '0.00008000',
        received: 8000,
        receivedf: '0.00008000',
        recv_confirms: 2,
        payment_address: '3LNh8tnnBpoYYxQkx6zU3hxT2o9zBHQVbh',
        time_completed: 1537712941 
    }
}

/**
 * Handle addition of not completed transaction
 */
const notCompleted = 
{
    CPCI7J0W7ETFT8LRI7AMWPJNCT: 
    { 
        error: 'ok',
        time_created: 1537188926,
        time_expires: 1537210526,
        status: -1,
        status_text: 'Cancelled / Timed Out',
        type: 'coins',
        coin: 'BTC',
        amount: 2000,
        amountf: '0.00002000',
        received: 0,
        receivedf: '0.00000000',
        recv_confirms: 0,
        payment_address: '3R1fUKSxzhDdmc6LRUpruRAn4BTPdwa1Kv'
    } 
}

/**
 * Handle addition of not completed transaction
 */
const empty = {}

module.exports = {
    duplicate,
    notCompleted,
    empty
}