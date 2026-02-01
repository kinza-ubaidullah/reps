# AnyReps Backend - 1688 API Integration

## 🚀 Setup Complete!

Your backend is now configured with:
- ✅ PostgreSQL Database
- ✅ 1688 DataHub API Integration
- ✅ Product Search Endpoints
- ✅ Real-time Product Data

---

## 📋 Database Tables

The following tables have been created:

1. **profiles** - User accounts and authentication
2. **chat_messages** - Community chat messages
3. **spreadsheets** - Shared spreadsheet resources
4. **trusted_sellers** - Verified seller listings
5. **products** - Cached 1688 product data
6. **agents** - Shipping agent information
7. **shipping_lines** - Shipping options and pricing

---

## 🔌 API Endpoints

### 1688 Product Search API

#### 1. Search Products
```bash
GET /api/1688/search?q=shoes&page=1
```

**Parameters:**
- `q` (required): Search keyword
- `page` (optional): Page number (default: 1)

**Example:**
```bash
curl http://localhost:3001/api/1688/search?q=sneakers&page=1
```

---

#### 2. Get Product Details
```bash
GET /api/1688/product/:itemId
```

**Parameters:**
- `itemId` (required): The product item ID

**Example:**
```bash
curl http://localhost:3001/api/1688/product/123456789
```

---

#### 3. Get Company Contact
```bash
GET /api/1688/company-contact?storeId=b2b-22129686061252fa5d
```

**Parameters:**
- `storeId` (required): The store/company ID

**Example:**
```bash
curl "http://localhost:3001/api/1688/company-contact?storeId=b2b-22129686061252fa5d"
```

---

#### 4. Get Store Information
```bash
GET /api/1688/store/:storeId
```

**Parameters:**
- `storeId` (required): The store ID

**Example:**
```bash
curl http://localhost:3001/api/1688/store/b2b-22129686061252fa5d
```

---

## 🛠️ Available Scripts

### Database Management
```bash
# Create the database
npm run db:create

# Setup database schema (create tables)
npm run db:setup
```

### Server Management
```bash
# Start backend server
npm run server

# Start frontend (Vite)
npm run dev
```

---

## 🔑 Environment Variables

Make sure your `.env` file contains:

```env
DATABASE_URL=postgres://postgres:database@123@localhost:5432/anyreps_db
JWT_SECRET=kuch_bhi_random_lamba_secret_string
PORT=3001

# RapidAPI - 1688 DataHub
RAPIDAPI_HOST=1688-datahub.p.rapidapi.com
RAPIDAPI_KEY=e20bdb91ffmsh85fb12bb4b9069bp13799ejsn3e956971cda8
```

---

## 📦 Frontend Integration

Use the `product1688Service.ts` in your React components:

```typescript
import { searchProducts1688, getProductDetails1688 } from './services/product1688Service';

// Search products
const results = await searchProducts1688('shoes', 1);

// Get product details
const product = await getProductDetails1688('123456789');

// Get company contact
const contact = await getCompanyContact('b2b-22129686061252fa5d');
```

---

## 🎯 Next Steps

1. **Integrate Search in UI**: Update your Search page to use `searchProducts1688()`
2. **Display Product Details**: Show real 1688 product data
3. **Cache Products**: Optionally save frequently searched products to the database
4. **Add Pagination**: Implement page navigation for search results

---

## 🔧 Troubleshooting

### Database Connection Issues
If you get database connection errors:
1. Make sure PostgreSQL is running
2. Verify credentials in `.env`
3. Run `npm run db:create` to create the database
4. Run `npm run db:setup` to create tables

### API Issues
If 1688 API calls fail:
1. Check your RapidAPI key is valid
2. Verify you have API credits
3. Check the RapidAPI dashboard for usage limits

---

## 📊 Server Status

- **Backend Server**: http://localhost:3001
- **Frontend (Vite)**: http://localhost:5173
- **Database**: PostgreSQL on localhost:5432

---

## 🎉 Success!

Your backend is now ready to serve real product data from 1688!

**Test the API:**
```bash
curl "http://localhost:3001/api/1688/company-contact?storeId=b2b-22129686061252fa5d"
```
