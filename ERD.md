# Entity-Relationship Diagram (ERD)
## Ursal Rice Milling Services Database

---

## Entities Overview

### 1. **AppUser**
User account management with status tracking.
- **id**: Unique identifier (ObjectId)
- **email**: User's email address (indexed)
- **displayName**: User's display name
- **authMethod**: Authentication method used
- **status**: ACTIVE or DEACTIVATED (indexed)
- **blockedAt**: Timestamp when user was blocked
- **blockReason**: Reason for blocking
- **deactivatedAt**: Timestamp when user was deactivated
- **lastActiveAt**: Last activity timestamp
- **createdAt**: Account creation timestamp
- **updatedAt**: Last update timestamp

**Relationships:**
- Referenced by: CartItem, Product, Order, OrderItem, InventoryTransaction (via IDs)

---

### 2. **Product**
Core product catalog with inventory and supplier tracking.
- **id**: Unique identifier (ObjectId)
- **userId**: Creator/owner ID
- **name**: Product name
- **description**: Product details
- **category**: Product category
- **price**: Current selling price
- **imageUrl**: Product image URL
- **downloadUrl**: Download link (if applicable)
- **isHidden**: Visibility flag
- **supplierId**: Link to supplier (FK)
- **stockOnHand**: Available inventory
- **stockOnOrder**: On-order quantity
- **stockAllocated**: Reserved quantity
- **reorderPoint**: Minimum stock threshold
- **isMilledRice**: Whether product is milled rice
- **millingYieldRate**: Conversion rate for unmilled→milled
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

**Relationships:**
- **1-to-Many** with CartItem (one product in many carts)
- **1-to-Many** with OrderItem (one product in many orders)
- **1-to-Many** with PurchaseOrderItem (one product in many POs)
- **1-to-Many** with InventoryTransaction (one product has many transactions)
- **1-to-Many** with InventoryItem (one product at multiple locations)
- **1-to-Many** with PriceHistory (one product has price change history)
- **Many-to-1** with Supplier (many products from one supplier)

---

### 3. **Supplier**
Vendor/supplier information for purchase orders.
- **id**: Unique identifier (ObjectId)
- **name**: Supplier name (indexed, unique)
- **email**: Contact email
- **phone**: Contact phone
- **address**: Physical address
- **note**: Additional notes
- **isActive**: Active status
- **createdAt**: Record creation timestamp
- **updatedAt**: Last update timestamp

**Relationships:**
- **1-to-Many** with Product (one supplier provides many products)
- **1-to-Many** with PurchaseOrder (one supplier has many POs)

---

### 4. **PurchaseOrder**
Purchase orders from suppliers for inventory replenishment.
- **id**: Unique identifier (ObjectId)
- **supplierId**: Link to supplier (FK)
- **orderDate**: Date order was placed
- **status**: Order status (Pending, Received, Partial, etc.)
- **note**: Order notes
- **paymentType**: ONE_TIME or MONTHLY
- **monthlyTerms**: Payment term duration (3, 6, or 12 months)
- **dueDate**: Payment due date
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

**Relationships:**
- **Many-to-1** with Supplier (many POs from one supplier)
- **1-to-Many** with PurchaseOrderItem (one PO has many items)
- **1-to-Many** with PurchaseOrderAttachment (one PO has many attachments)
- **1-to-Many** with PurchaseReturn (one PO has many returns)
- Referenced by: InventoryTransaction, FinanceTransaction

---

### 5. **PurchaseOrderItem**
Line items within a purchase order.
- **id**: Unique identifier (ObjectId)
- **purchaseOrderId**: Link to PO (FK)
- **productId**: Link to product (FK)
- **orderedQty**: Quantity ordered
- **receivedQty**: Quantity received
- **returnedQty**: Quantity returned
- **price**: Unit price
- **lineStatus**: Item status (Pending, Received, Partial)
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

**Relationships:**
- **Many-to-1** with PurchaseOrder (many items in one PO)
- **Many-to-1** with Product (many POs for one product)
- **1-to-Many** with Backorder (one item can have multiple backorders)
- **1-to-Many** with PurchaseReturnItem (one item can have return entries)

---

### 6. **Backorder**
Tracks backorders for purchase order items.
- **id**: Unique identifier (ObjectId)
- **purchaseOrderItemId**: Link to PO item (FK)
- **quantity**: Backorder quantity
- **expectedDate**: Expected delivery date
- **status**: Backorder status (Open, Fulfilled)
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

**Relationships:**
- **Many-to-1** with PurchaseOrderItem (many backorders for one PO item)

---

### 7. **PurchaseOrderAttachment**
Attached documents for purchase orders (invoices, receipts).
- **id**: Unique identifier (ObjectId)
- **purchaseOrderId**: Link to PO (FK)
- **type**: INVOICE, RECEIPT, or OTHER
- **fileName**: Original file name
- **fileUrl**: URL to uploaded file
- **uploadedAt**: Upload timestamp
- **note**: Additional notes

**Relationships:**
- **Many-to-1** with PurchaseOrder (many attachments per PO)

---

### 8. **PurchaseReturn**
Return records from suppliers.
- **id**: Unique identifier (ObjectId)
- **purchaseOrderId**: Link to original PO (FK)
- **reason**: Reason for return
- **createdAt**: Return creation timestamp

**Relationships:**
- **Many-to-1** with PurchaseOrder (many returns per PO)
- **1-to-Many** with PurchaseReturnItem (one return has many items)

---

### 9. **PurchaseReturnItem**
Individual items being returned.
- **id**: Unique identifier (ObjectId)
- **purchaseReturnId**: Link to return (FK)
- **purchaseOrderItemId**: Link to original PO item (FK)
- **quantity**: Quantity returned
- **note**: Return reason/notes
- **createdAt**: Creation timestamp

**Relationships:**
- **Many-to-1** with PurchaseReturn (many items in one return)
- **Many-to-1** with PurchaseOrderItem (return references original PO item)

---

### 10. **InventoryTransaction**
Audit trail for all inventory movements.
- **id**: Unique identifier (ObjectId)
- **productId**: Link to product (FK)
- **kind**: Transaction type
  - STOCK_IN: Received inventory
  - STOCK_OUT: Shipped/sold inventory
  - RETURN_IN: Received return from customer
  - RETURN_OUT: Return to supplier
  - ADJUSTMENT: Inventory correction
  - PO_ON_ORDER: Purchase order placed
  - MILLING_IN: Unmilled rice received
  - MILLING_OUT: Milled rice produced
- **purchaseOrderId**: Link to PO (if applicable)
- **purchaseOrderItemId**: Link to PO item (if applicable)
- **purchaseReturnId**: Link to return (if applicable)
- **quantity**: Transaction quantity
- **unitPrice**: Unit price at transaction time
- **note**: Transaction notes
- **locationId**: Link to storage location (if applicable)
- **createdBy**: User who created transaction
- **createdAt**: Transaction timestamp

**Relationships:**
- **Many-to-1** with Product (many transactions per product)
- **Many-to-1** with StorageLocation (many transactions per location)

---

### 11. **StorageLocation**
Hierarchical storage/warehouse structure.
- **id**: Unique identifier (ObjectId)
- **name**: Location name (unique)
- **code**: Location code (unique)
- **type**: WAREHOUSE, SHELF, BIN, or ZONE
- **description**: Location details
- **capacity**: Max capacity units
- **parentId**: Parent location (for hierarchy)
- **isActive**: Active status
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

**Relationships:**
- **Self-referential Many-to-1** with StorageLocation (parent location)
- **1-to-Many** with StorageLocation (child locations)
- **1-to-Many** with InventoryItem (one location has many products)
- **1-to-Many** with InventoryTransaction (one location has many transactions)

---

### 12. **InventoryItem**
Product-location mapping with quantities.
- **id**: Unique identifier (ObjectId)
- **productId**: Link to product (FK)
- **locationId**: Link to storage location (FK)
- **quantity**: Current quantity at this location
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

**Constraints:** Unique combination of (productId, locationId)

**Relationships:**
- **Many-to-1** with Product (many locations per product)
- **Many-to-1** with StorageLocation (many products per location)

---

### 13. **PriceHistory**
Track all product price changes.
- **id**: Unique identifier (ObjectId)
- **productId**: Link to product (FK)
- **oldPrice**: Previous price
- **newPrice**: New price
- **changedBy**: User ID who changed price
- **reason**: Reason for price change
- **createdAt**: Change timestamp

**Relationships:**
- **Many-to-1** with Product (many price changes per product)

---

### 14. **CartItem**
Shopping cart items for customers.
- **id**: Unique identifier (ObjectId)
- **userId**: Customer user ID
- **productId**: Link to product (FK)
- **quantity**: Quantity in cart
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

**Relationships:**
- **Many-to-1** with Product (many cart items per product)

---

### 15. **Order**
Customer orders/sales.
- **id**: Unique identifier (ObjectId)
- **userId**: Customer user ID
- **email**: Customer email
- **total**: Order total amount
- **status**: Order status (completed, pending, cancelled)
- **createdAt**: Order creation timestamp

**Relationships:**
- **1-to-Many** with OrderItem (one order has many items)
- Referenced by: FinanceTransaction

---

### 16. **OrderItem**
Individual items in a customer order.
- **id**: Unique identifier (ObjectId)
- **userId**: User ID
- **productId**: Link to product (FK)
- **orderId**: Link to order (FK)
- **quantity**: Quantity ordered
- **price**: Unit price at time of order

**Relationships:**
- **Many-to-1** with Product (many order items per product)
- **Many-to-1** with Order (many items per order)

---

### 17. **Finance**
Financial summary/aggregations.
- **id**: Unique identifier (ObjectId)
- **totalPayables**: Total amount owed to suppliers
- **accountBalance**: Current account balance
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

**Relationships:**
- **1-to-Many** with FinanceTransaction (one Finance record has many transactions)

---

### 18. **FinanceTransaction**
Individual financial transactions.
- **id**: Unique identifier (ObjectId)
- **financeId**: Link to Finance (FK)
- **type**: PAYABLE, PAYMENT, or SALE
- **amount**: Transaction amount
- **description**: Transaction description
- **orderId**: Link to order (if sales-related)
- **purchaseOrderId**: Link to PO (if payables-related)
- **createdAt**: Transaction timestamp

**Relationships:**
- **Many-to-1** with Finance (many transactions per Finance record)

---

## Relationship Summary

```
AppUser
  ↓ (userId references)
  ├─→ CartItem (via userId)
  ├─→ Product (via userId)
  ├─→ Order (via userId)
  ├─→ OrderItem (via userId)
  └─→ InventoryTransaction (via createdBy)

Supplier ←─────────── Product
  ↓ (1 supplier : M products)
  └─→ PurchaseOrder

PurchaseOrder ←──────────── PurchaseOrderItem
  ↓ (1 PO : M items)        ↓ (M items per product)
  ├─→ PurchaseOrderAttachment
  ├─→ PurchaseReturn
  └─→ Finance/FinanceTransaction

PurchaseOrderItem
  ├─→ Backorder (1 item : M backorders)
  └─→ PurchaseReturnItem (M items can be returned)

PurchaseReturn
  └─→ PurchaseReturnItem (1 return : M items)

Product
  ├─→ CartItem (1 product : M cart items)
  ├─→ OrderItem (1 product : M order items)
  ├─→ PurchaseOrderItem (1 product : M PO items)
  ├─→ InventoryItem (1 product : M locations)
  ├─→ InventoryTransaction (1 product : M transactions)
  └─→ PriceHistory (1 product : M price changes)

StorageLocation (Hierarchical)
  ├─→ InventoryItem (1 location : M products)
  └─→ InventoryTransaction (1 location : M transactions)

InventoryItem ←─────── StorageLocation
  ↓ (Composite: productId + locationId)

Order
  ├─→ OrderItem (1 order : M items)
  └─→ Finance/FinanceTransaction (sales tracking)

Finance
  └─→ FinanceTransaction (1 finance : M transactions)
```

---

## Key Business Flows

### 1. **Purchase Order Flow**
Supplier → PurchaseOrder → PurchaseOrderItem → (InventoryTransaction: PO_ON_ORDER)
→ Receive → (InventoryTransaction: STOCK_IN) → InventoryItem

### 2. **Sales Flow**
Product → CartItem → Order → OrderItem → (InventoryTransaction: STOCK_OUT)
→ Finance/FinanceTransaction (SALE)

### 3. **Return Flow**
Customer Return: Order → (InventoryTransaction: RETURN_IN)
Supplier Return: PurchaseOrder → PurchaseReturn → PurchaseReturnItem
→ (InventoryTransaction: RETURN_OUT) → Finance/FinanceTransaction

### 4. **Inventory Tracking**
Product → InventoryItem (at StorageLocation) ← InventoryTransaction (audit trail)

### 5. **Price Management**
Product → PriceHistory (tracks all price changes with reason and actor)

### 6. **Milling Operations**
Unmilled Rice (isMilledRice: false) → (InventoryTransaction: MILLING_OUT)
→ Milled Rice (isMilledRice: true) with millingYieldRate conversion

---

## Indexes for Performance

- **AppUser**: email, status
- **Product**: category, supplierId (implicit)
- **Supplier**: name
- **PurchaseOrderItem**: purchaseOrderId, productId
- **InventoryTransaction**: productId, purchaseOrderId, locationId, kind
- **InventoryItem**: productId, locationId
- **StorageLocation**: type, parentId
- **PriceHistory**: productId, createdAt
- **FinanceTransaction**: financeId, type

---

## Data Constraints

- **InventoryItem**: Unique constraint on (productId, locationId)
- **StorageLocation**: Unique constraints on name and code
- **Cascading Deletes**: Product deletion cascades to CartItem, OrderItem, InventoryTransaction, and PriceHistory
- **Purchase Order Cascade**: PurchaseOrder deletion cascades through related entities
- **Storage Hierarchy**: No delete action on parent location (prevents orphaning)

---

## Enums

### UserStatus
- **ACTIVE**: User account is active
- **DEACTIVATED**: User account is deactivated

### InventoryTransaction.kind
- **STOCK_IN**: Inventory received
- **STOCK_OUT**: Inventory shipped
- **RETURN_IN**: Return from customer received
- **RETURN_OUT**: Return to supplier
- **ADJUSTMENT**: Manual inventory correction
- **PO_ON_ORDER**: Purchase order placed
- **MILLING_IN**: Raw rice received for milling
- **MILLING_OUT**: Milled rice produced

---

## Storage Considerations

- **Database**: MongoDB (NoSQL)
- **ObjectIds**: Used for all primary keys
- **Indexes**: Strategic indexing on frequently queried fields
- **Relationships**: Foreign key references via ObjectId fields
