# Payment Callback API Documentation

This API handles callbacks from various payment gateways and administrative services to update transaction statuses and user balances.

## Base URL
`http://localhost:3001/api`

> [!IMPORTANT]
> All requests must include the header `-H "Content-Type: application/json"`. If this header is missing, the server will not be able to parse the JSON body, and you will see an empty object `{}` in the logs.

---

### 1. Pakasir Callback
Handles notifications from the Pakasir payment gateway.

- **URL**: `/callback/pakasir`
- **Method**: `POST`
- **Headers**:
    - `x-api-key`: Required (Must match `config.paymentGateway.pakasir.apiKey`)
- **Request Body**:
```json
{
  "trx_id": "string",
  "order_id": "string",
  "status": "paid|success|failed|expired",
  "amount": number
}
```
- **Validation**:
    - Verifies `x-api-key` header.
- **Actions**:
    - `paid` | `success`: Marks order as **Paid**.
    - `failed` | `expired`: Marks order as **Cancelled**.

---

### 2. Tokopay Callback
Handles notifications from the Tokopay payment gateway.

- **URL**: `/callback/tokopay`
- **Method**: `POST`
- **Request Body**:
```json
{
  "trx_id": "string",
  "merchant_ref": "string",
  "status": "Success|Paid|Failed|Expired",
  "amount": number,
  "signature": "string"
}
```
- **Signature Calculation**:
    - `MD5(merchant_id + secret + merchant_ref)`
- **Actions**:
    - `Success` | `Paid`: Marks order as **Paid**.
    - `Failed` | `Expired`: Marks order as **Cancelled**.

---

### 3. Duitku Callback
Handles notifications from the Duitku payment gateway.

- **URL**: `/callback/duitku`
- **Method**: `POST`
- **Request Body**:
```json
{
  "merchantCode": "string",
  "amount": "string",
  "merchantOrderId": "string",
  "productDetail": "string",
  "paymentCode": "string",
  "resultCode": "00|01|02",
  "merchantUserId": "string",
  "reference": "string",
  "signature": "string",
  "publisherOrderId": "string",
  "spUserHash": "string",
  "settlementDate": "string",
  "issuerCode": "string"
}
```
- **Signature Calculation**:
    - `MD5(merchantCode + amount + merchantOrderId + apiKey)`
- **Actions**:
    - `resultCode: "00"`: Marks order as **Paid**.
    - `resultCode: "02"`: Marks order as **Cancelled**.

---

### 4. Tripay Callback
Handles notifications from the Tripay payment gateway.

- **URL**: `/callback/tripay`
- **Method**: `POST`
- **Request Body**:
```json
{
  "reference": "string",
  "merchant_ref": "string",
  "payment_method": "string",
  "payment_method_code": "string",
  "total_amount": number,
  "fee_merchant": number,
  "fee_customer": number,
  "total_fee": number,
  "amount_received": number,
  "is_closed_payment": number,
  "status": "PAID|EXPIRED|FAILED",
  "paid_at": "string",
  "note": "string",
  "signature": "string"
}
```
- **Signature Calculation**:
    - `HMAC-SHA256(merchantCode + merchant_ref + total_amount)` using `privateKey`.
- **Actions**:
    - `status: "PAID"`: Marks order as **Paid**.
    - `status: "EXPIRED"` | `"FAILED"`: Marks order as **Cancelled**.

---

### 5. Midtrans Callback
Handles notifications from the Midtrans payment gateway.

- **URL**: `/callback/midtrans`
- **Method**: `POST`
- **Request Body**:
```json
{
  "transaction_time": "string",
  "transaction_status": "settlement|capture|deny|cancel|expire|failure",
  "transaction_id": "string",
  "status_message": "string",
  "status_code": "string",
  "signature_key": "string",
  "payment_type": "string",
  "order_id": "string",
  "merchant_id": "string",
  "gross_amount": "string",
  "fraud_status": "string",
  "currency": "string"
}
```
- **Signature Calculation**:
    - `SHA512(order_id + status_code + gross_amount + serverKey)`
- **Actions**:
    - `transaction_status: "settlement" | "capture"`: Marks order as **Paid**.
    - `transaction_status: "deny" | "cancel" | "expire" | "failure"`: Marks order as **Cancelled**.

---

### 6. Fazz Callback
Handles notifications from the Fazz payment gateway.

- **URL**: `/callback/fazz`
- **Method**: `POST`
- **Headers**:
    - `x-callback-token`: Optional sequence validation.
- **Request Body**:
```json
{
  "data": {
    "id": "string",
    "type": "string",
    "attributes": {
      "status": "completed|paid|expired|failed",
      "referenceId": "string",
      "amount": number,
      "createdAt": "string",
      "paidAt": "string"
    }
  }
}
```
- **Actions**:
    - `status: "completed" | "paid"`: Marks order as **Paid**.
    - `status: "expired" | "failed"`: Marks order as **Cancelled**.

---

### 7. Xendit Callback
Handles notifications from the Xendit payment gateway.

- **URL**: `/callback/xendit`
- **Method**: `POST`
- **Headers**:
    - `x-callback-token`: Required (Must match `config.paymentGateway.xendit.callbackToken`)
- **Request Body**:
```json
{
  "id": "string",
  "external_id": "string",
  "qr_id": "string",
  "type": "string",
  "amount": number,
  "status": "COMPLETED|EXPIRED",
  "currency": "string",
  "created": "string",
  "updated": "string",
  "callback_url": "string"
}
```
- **Actions**:
    - `status: "COMPLETED"`: Marks order as **Paid**.
    - `status: "EXPIRED"`: Marks order as **Cancelled**.

---

### 8. Doku Callback
Handles notifications from the Doku payment gateway.

- **URL**: `/callback/doku`
- **Method**: `POST`
- **Headers**:
    - `client-id`: Required
    - `request-id`: Required
    - `request-timestamp`: Required
    - `signature`: Required
- **Request Body**:
```json
{
  "order": {
    "invoice_number": "string",
    "amount": number,
    "currency": "string"
  },
  "transaction": {
    "status": "SUCCESS|FAILED|EXPIRED",
    "date": "string",
    "original_request_id": "string"
  }
}
```
- **Signature Calculation**:
    - `HMAC-SHA256(secretKey, "Client-Id:<id>\nRequest-Id:<id>\nRequest-Timestamp:<ts>\nRequest-Target:/api/callback/doku\nDigest:<digest>")`
    - `Digest` is `Base64(SHA256(RequestBody))`
- **Actions**:
    - `status: "SUCCESS"`: Marks order as **Paid**.
    - `status: "FAILED" | "EXPIRED"`: Marks order as **Cancelled**.

---

### 9. Qris.pw Callback
Handles notifications from the Qris.pw payment gateway.

- **URL**: `/callback/qrispw`
- **Method**: `POST`
- **Headers**:
    - `X-API-Key`: Required (Must match `config.paymentGateway.qrispw.apiKey`)
    - `X-API-Secret`: Required (Must match `config.paymentGateway.qrispw.apiSecret`)
- **Request Body**:
```json
{
  "transaction_id": "string",
  "order_id": "string",
  "amount": number,
  "status": "paid|failed|expired",
  "timestamp": number,
  "signature": "string"
}
```
- **Verification**:
    - **Signature**: `HMAC-SHA256(JSON_Payload_Excluded_Signature, apiSecret)`
    - **Explicit Check**: Server calls `https://qris.pw/api/check-payment.php` to verify status.
- **Actions**:
    - `status: "paid"`: Marks order as **Paid**.
    - `status: "failed" | "expired"`: Ignored or logged.

---

### 10. Donate Callback
Internal service to log donations and update user balance.

- **URL**: `/callback/donate`
- **Method**: `POST`
- **Request Body**:
```json
{
  "growId": "string",
  "amount": number
}
```
- **Response**:
    - `200 OK`: `{ "status": "success", "message": "Balance updated" }`
    - `200 OK`: `{ "status": "error", "message": "User or rate not found" }`
- **Logic**:
    - Calculates `rupiah = amount * (donateRate / 100)`.
    - Increments user balance in MongoDB.

---

## Shared Response Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request received and processed (even if signature or logic fails, many gateways prefer 200). |
| `401 Unauthorized`| Missing or invalid API key/token. |
| `500 Internal Error`| Database connection failure or runtime error. |

