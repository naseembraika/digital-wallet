# Digital Wallet

A Node.js and MongoDB API for managing wallet users, transferring money between
wallets, sending money to external bank accounts, and recording incoming bank
payments.

## Setup

Start the server:

```sh
npm run start:dev
```

## Endpoints

All JSON endpoints accept and return JSON. Money requests require a unique
UUID in the `idempotency-key` header. Reusing a key is rejected.

### Users

| Method | Path         | Description              |
| ------ | ------------ | ------------------------ |
| `POST` | `/users`     | Create a wallet user     |
| `GET`  | `/users`     | List wallet users        |
| `GET`  | `/users/:id` | Get a user by MongoDB ID |

Create a user:

```http
POST http://localhost:3000/users
Content-Type: application/json

{
  "name": "Foo Bar",
  "balance": 500
}
```

### Internal transfer

`POST /transactions/send/internal` transfers funds between wallet users.
`senderId` and `receiverId` are MongoDB user IDs.

```http
POST http://localhost:3000/transactions/send/internal
Content-Type: application/json
idempotency-key: bbd11410-0abe-48e8-a62e-5c08465a2057

{
  "senderId": "SENDER_USER_ID",
  "receiverId": "RECEIVER_USER_ID",
  "amount": 10
}
```

### External transfer

`POST /transactions/send/external` sends money from a wallet to a bank account.
The sender's wallet is found by `senderAccount`. The balance check converts the
requested currency amount to USD using ExchangeRate-API.

```http
POST http://localhost:3000/transactions/send/external
Content-Type: application/json
idempotency-key: bbd10408-0abe-48e8-a62e-5c08465a2052

{
  "senderAccount": "DIGITAL05872776457346454",
  "bankCode": "FDCSSARI",
  "accountNumber": "SA6980000204608016211111",
  "beneficiaryName": "Some One",
  "amount": 50,
  "currency": "ILS",
  "notes": ["Invoice payment"],
  "paymentType": 100,
  "chargeDetails": "RSA"
}
```

The successful response includes the transaction, updated sender account, and
generated XML payment request.

### Incoming bank payment webhooks

`POST /webhook/:bank/:accountNumber` records a payment and credits the wallet identified by its account number. `bank` must be `paytech` or `acme`. Send the bank-specific payload as plain text with a unique UUID `idempotency-key`.

PayTech payload format:

```http
POST http://localhost:3000/webhook/paytech/DIGITAL72443074744246207
Content-Type: text/plain
idempotency-key: 735dee91-fa14-4731-bb4b-65984bd71622

20250615,50#BANK-REFERENCE#invoice/INV-42
```

Format: `YYYYMMDD,amount#reference#note-key/note-value/...`

Acme payload format:

```http
POST http://localhost:3000/webhook/acme/DIGITAL72443074744246207
Content-Type: text/plain
idempotency-key: 735dee82-fa14-4731-bb4b-65984bd71622

50//BANK-REFERENCE//20250615
```

Format: `amount//reference//YYYYMMDD`

## Error responses

Errors return a JSON body with a `status` and `message`. Common errors include
invalid or repeated idempotency keys, unknown users/accounts, and insufficient
funds. Unknown routes return `404`.
