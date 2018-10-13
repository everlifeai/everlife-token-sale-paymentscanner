# Payment Scanner CoinPayments & Stellar
This application is meant to scan and store transactions (and their details) from a Stellar public key
and from the CoinPayments API which accepts BTC and ETH. The information can later be used for distributing the correct amount of tokens.

Install all packages: `npm install`

Run tests: `npm run mock`

Start app: `npm start` with nodemon

Start app with node: `npm run serve` (node src/app)


## Environment Variables
`COINPAYMENT_KEY=<public-key>`

`COINPAYMENT_SECRET=<secret-key>`

`DB_CONNECTION_STRING=<mongo-connection-uri>`

`DB_NAME=<collection-name-mongo>`

`STELLAR_SRC_ACC=<source-acc>` Account that receives all Stellar XLM payments

`STELLAR_TESTNET=<true OR false>` Whether to use test network (true) or public (false) network


Created by Michiel Mulders.
