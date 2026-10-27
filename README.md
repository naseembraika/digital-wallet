# This is guides of Digital Wallet application

# How to use the app

- Create user account
- Transferred money [internal/external]

# Create user `end-point`

```rest
POST http://localhost:3000/users/
Content-Type: application/json

{
  "name": "New User",
  "balance": 100
}
```

# Send money internal `end-point`

```rest
POST http://localhost:3000/transactions/send/internal
Content-Type: application/json
idempotency-key: abc123

{
  "senderId": "6addf2ca7fbc3d7db7d51ad0",
  "receiverId": "6addf2dc7fbc3d7db7d51ad1",
  "amount": 100
}
```
