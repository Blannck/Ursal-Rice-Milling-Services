# Ursal Rice Milling Services

A comprehensive web-based management system for rice milling operations, featuring inventory management, order processing, supplier relations, and financial tracking.

## 📦 Project Modules

### 1. General (Landing Page)
- Product browsing and catalog display
- Company information and services
- Public-facing interface for customers
- Responsive design for all devices

### 2. User Management
- User registration and authentication
- Customer account management
- Admin controls (block/unblock users)
- User profile management
- Secure login with Stack Auth

### 3. Admin Dashboard
- Centralized control panel for administrators
- Overview of business metrics and statistics
- Quick access to all management modules
- Real-time notifications and alerts
- System-wide monitoring and reporting

### 4. Item Management
- Create and manage rice product categories
- Milled and unmilled rice classification
- Product pricing and descriptions
- Image management for products
- Price history tracking
- Product visibility controls (show/hide)
- Reorder point configuration

### 5. Supplier Management
- Maintain supplier database
- Contact information (email, phone, address)
- Supplier status management (active/inactive)
- Supplier notes and documentation
- Link suppliers to purchase orders

### 6. Purchase Order Management
- Create purchase orders for unmilled rice
- Select suppliers and products
- Flexible payment terms:
  - One-time payment
  - Monthly payment schedules (3, 6, or 12 months)
- Receive inventory from purchase orders
- Track PO status (Pending, Partial, Completed)
- Delivery location specification
- Purchase order attachments and documentation

### 7. Inventory Management
- Multi-location inventory tracking
- Stock operations:
  - Stock-in from purchase orders
  - Stock transfer between locations
  - Stock adjustments
  - Milling operations (convert unmilled to milled rice)
- Real-time stock levels across all locations
- Inventory reports and statistics
- Reorder alerts for low stock
- Detailed stock movement audit trail
- Location management (warehouses, mills, retail stores)

### 8. Sales Order
- Customer order placement with detailed checkout
- Shopping cart functionality
- Multi-step checkout process:
  - Customer information collection (name, phone, address)
  - Delivery type selection (Pickup/Delivery)
  - Payment method selection (COD/GCash)
- GCash QR code payment simulation
- Order tracking and status updates
- Delivery management with shipment tracking
- Multi-delivery support (partial stock handling)
- Order fulfillment workflow
- Invoice generation and printing
- Order history for completed orders

### 9. Finance & Credit Sales Management
- Account balance tracking
- Transaction history and logs
- Sales revenue monitoring
- Supplier payables management
- Automated monthly payment processing
- Credit sales tracking
- Financial reports and analytics
- Cash flow management
- Payment status monitoring

## 🌾 Key Features

### For Customers
- Browse rice products with detailed information
- Add products to shopping cart with quantity management
- Complete checkout with delivery options
- Track order status and deliveries
- View and print invoices
- Multiple payment methods (COD, GCash)

### For Administrators
- Complete dashboard with business overview
- Manage all aspects of the business operations
- Track inventory across multiple locations
- Process and fulfill customer orders
- Manage suppliers and purchase orders
- Monitor financial transactions and credit sales
- Generate comprehensive reports
- Control user access and permissions

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

## 🔑 Module Details

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
