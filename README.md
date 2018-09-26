# Payment Scanner CoinPayments & Stellar
This application is meant to scan and store transactions (and their details) from a Stellar public key
and from the CoinPayments API which accepts BTC and ETH. The information can later be used for distributing the correct amount of tokens.

Run tests: `npm run mock`

Start app: `npm start` -> Will spawn nodemon -> Replace with a better solution and remove redundant Babel

## Environment Variables
`COINPAYMENT_KEY=<public-key>`

`COINPAYMENT_SECRET=<secret-key>`

`MONGO_DB_URL=<mongo-connection-uri>`

`MONGO_COLLECTION=<collection-name-mongo>`

`STELLAR_SRC_ACC=<source-acc>` Account that receives all Stellar XLM payments

## Todo
- Remove babel garbage
- Standalone run command without nodemon



Created by Michiel Mulders.