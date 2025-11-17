# Ursal Rice Milling Services

A comprehensive web-based management system for rice milling operations, featuring inventory management, order processing, supplier relations, and financial tracking.

## 🌾 Features

### Customer Features
- **Product Browsing**: View available rice products with detailed information
- **Shopping Cart**: Add products to cart with quantity management
- **Order Placement**: Multi-step checkout process with customer information collection
- **Payment Options**: 
  - Pickup orders (direct placement)
  - Delivery orders with COD or GCash payment
  - GCash QR code simulation with 20-second timer
- **Order Tracking**: View order status and delivery information
- **Invoice Generation**: Detailed invoices for all orders

### Admin Features

#### Order Management
- **Manage Orders**: Track and fulfill customer orders
- **Delivery Management**: Handle multiple deliveries per order with shipment tracking
- **Order History**: View completed and fulfilled orders separately
- **Fulfillment Tracking**: Mark deliveries as fulfilled with status updates

#### Inventory Management
- **Product Categories**: Create and manage rice categories (milled/unmilled)
- **Multi-Location Inventory**: Track stock across different warehouse locations
- **Stock Operations**:
  - Stock-in from purchase orders
  - Stock transfer between locations
  - Stock adjustments
  - Milling operations (convert unmilled to milled rice)
- **Inventory Reports**: Detailed stock levels, valuations, and statistics
- **Reorder Alerts**: Automatic low-stock notifications

#### Purchase Orders
- **Supplier Management**: Maintain supplier information and contacts
- **PO Creation**: Create purchase orders for unmilled rice
- **Payment Terms**: Support for one-time and monthly payment schedules
- **Receiving**: Receive and process incoming inventory
- **Status Tracking**: Monitor PO status (Pending, Partial, Completed)

#### Financial Management
- **Account Balance**: Track total business finances
- **Transaction History**: Record all financial activities
- **Sales Tracking**: Monitor revenue from customer orders
- **Payables Management**: Track supplier payments and schedules
- **Monthly Payments**: Automated processing of scheduled supplier payments

#### Reporting & Analytics
- **Sales Reports**: Analyze revenue with date filtering and visualizations
- **Inventory Reports**: Stock levels, valuations, and product statistics
- **Price History**: Track price changes with historical records
- **Transaction Logs**: Complete audit trail of all inventory movements

#### User Management
- **User Accounts**: Manage customer accounts
- **Admin Controls**: Block/unblock users
- **Authentication**: Secure login with Stack Auth

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives with shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js
- **Database**: MongoDB with Prisma ORM
- **Authentication**: Stack Auth (@stackframe/stack)
- **File Upload**: UploadThing
- **Payment**: PayPal integration

### Development Tools
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js 20.x or higher
- MongoDB database
- Stack Auth account
- UploadThing account (optional, for file uploads)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Ursal-Rice-Milling-Services-main
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="your-mongodb-connection-string"

# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID="your-stack-project-id"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="your-stack-publishable-key"
STACK_SECRET_SERVER_KEY="your-stack-secret-key"

# Admin Credentials
ADMIN_ID="your-admin-user-id"
ADMIN_EMAIL="your-admin-email"

# UploadThing (Optional)
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"


### 4. Database Setup

Generate Prisma client and sync database:

```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── actions/          # Server actions for data mutations
├── app/             # Next.js app router pages
│   ├── admin/       # Admin dashboard pages
│   ├── api/         # API routes
│   ├── cart/        # Shopping cart
│   ├── orders/      # Order management
│   └── products/    # Product listings
├── components/      # Reusable React components
│   ├── admin/       # Admin-specific components
│   └── ui/          # shadcn/ui components
├── lib/            # Utility functions and configurations
└── types/          # TypeScript type definitions

prisma/
└── schema.prisma   # Database schema

scripts/
└── *.ts           # Utility scripts
```

## 🔑 Key Features Explained

### Multi-Location Inventory
Track rice inventory across different storage locations (warehouses, mills, retail stores) with real-time stock levels and transfer capabilities.

### Milling Operations
Convert unmilled rice to milled rice with configurable yield rates, automatically adjusting inventory levels and creating transaction records.

### Delivery Management
Orders can have multiple deliveries based on stock availability:
- **Full Stock**: Single delivery with all items
- **Partial Stock**: Multiple deliveries (available stock + backorder)
- **No Stock**: Backorder delivery pending inventory

### Payment Terms
Support for flexible supplier payment schedules:
- One-time payment
- Monthly payments (3, 6, or 12 months)
- Automated payment processing

### Customer Checkout Flow
1. Customer fills in name, phone, and delivery address
2. Selects delivery type (Pickup or Delivery)
3. For delivery, chooses payment method (COD or GCash)
4. GCash payments show QR code with 20-second simulation timer
5. Order is automatically placed with all customer details saved

## 📊 Database Schema

Key models:
- **Category**: Rice products (milled/unmilled)
- **InventoryItem**: Stock levels per location
- **Location**: Storage facilities
- **Order**: Customer orders with deliveries
- **Delivery**: Individual shipments within orders
- **PurchaseOrder**: Supplier orders
- **Supplier**: Supplier information
- **Finance**: Financial tracking
- **InventoryTransaction**: Stock movement audit trail

## 🎨 UI/UX Features

- Responsive design for desktop and mobile
- Dark mode support
- Toast notifications for user feedback
- Loading states and skeleton screens
- Real-time search and filtering
- Interactive charts and visualizations
- Print-friendly invoice layouts

## 🔒 Security

- Server-side authentication with Stack Auth
- Protected admin routes
- User access control (block/unblock functionality)
- Secure API endpoints
- Environment variable protection

## 📝 Scripts

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint

# Database
npx prisma generate
npx prisma studio

# Run monthly payment processing
npm run run-monthly-payments
```

## 🤝 Contributing

This is a school project for Ursal Rice Milling Services. For contributions or suggestions, please contact the development team.

## 📄 License

Private - All rights reserved.

## 👥 Support

For issues or questions, please contact the administrator.

---

**Built with ❤️ for Ursal Rice Milling Services**
