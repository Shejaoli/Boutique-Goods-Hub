import { db } from "@workspace/db";
import {
  usersTable, categoriesTable, suppliersTable, productsTable,
  ordersTable, orderItemsTable, expensesTable, staffTable,
  promoCodesTable, activityTable, notificationsTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding ISOKO database...");

  // Admin user
  const adminHash = await bcrypt.hash("admin@isoko1!2@", 10);
  const [admin] = await db.insert(usersTable).values({
    name: "ISOKO Admin", email: "admin@isoko.com",
    passwordHash: adminHash, role: "owner",
  }).onConflictDoNothing().returning();

  // Categories
  const catData = [
    { name: "Grains & Cereals", icon: "🌾" },
    { name: "Cooking Oils", icon: "🫙" },
    { name: "Legumes & Nuts", icon: "🫘" },
    { name: "Condiments", icon: "🧂" },
    { name: "Flour & Starch", icon: "🌾" },
    { name: "Sugar & Sweeteners", icon: "🍬" },
  ];
  const cats = await db.insert(categoriesTable).values(catData).onConflictDoNothing().returning();

  // Suppliers
  const supplierData = [
    { name: "AgriSupply Co.", contactPerson: "Emeka Johnson", phone: "+234 801 234 5678", address: "15 Trade Road, Kano" },
    { name: "NigeriaFresh Ltd", contactPerson: "Aisha Bello", phone: "+234 802 345 6789", address: "22 Market St, Lagos" },
    { name: "FarmDirect NG", contactPerson: "Chidi Okafor", phone: "+234 803 456 7890", address: "7 Farm Lane, Enugu" },
  ];
  const supps = await db.insert(suppliersTable).values(supplierData).onConflictDoNothing().returning();

  // Products
  const grainId = cats[0]?.id ?? 1;
  const oilId = cats[1]?.id ?? 2;
  const legId = cats[2]?.id ?? 3;
  const condId = cats[3]?.id ?? 4;
  const flourId = cats[4]?.id ?? 5;
  const sugarId = cats[5]?.id ?? 6;
  const s1 = supps[0]?.id ?? 1;
  const s2 = supps[1]?.id ?? 2;
  const s3 = supps[2]?.id ?? 3;

  const productData = [
    { name: "Long Grain Parboiled Rice", description: "Premium quality Nigerian parboiled rice, perfect for jollof and fried rice.", price: "45000", originalPrice: "50000", categoryId: grainId, unit: "50kg bag", stockQuantity: 120, minStockLevel: 20, supplierId: s1, isFeatured: true, discountPercent: 10, totalSold: 340 },
    { name: "Golden Groundnut Oil", description: "Pure cold-pressed groundnut oil, great for all Nigerian cooking.", price: "8500", originalPrice: "9500", categoryId: oilId, unit: "5L bottle", stockQuantity: 85, minStockLevel: 15, supplierId: s2, isFeatured: true, discountPercent: 11, totalSold: 215 },
    { name: "Soya Bean Oil", description: "Refined soya oil, light and healthy for everyday cooking.", price: "7200", categoryId: oilId, unit: "5L bottle", stockQuantity: 60, minStockLevel: 20, supplierId: s2, totalSold: 180 },
    { name: "Dangote Semolina", description: "Fine quality semolina for swallow and pastries.", price: "12000", categoryId: flourId, unit: "25kg bag", stockQuantity: 45, minStockLevel: 10, supplierId: s1, totalSold: 95 },
    { name: "Honey Beans (Oloyin)", description: "Sweet-flavored honey beans, ideal for stews and porridge.", price: "18000", categoryId: legId, unit: "25kg bag", stockQuantity: 35, minStockLevel: 8, supplierId: s3, isFeatured: true, totalSold: 128 },
    { name: "White Granulated Sugar", description: "Pure refined sugar, perfect sweetener for drinks and baking.", price: "22000", categoryId: sugarId, unit: "50kg bag", stockQuantity: 5, minStockLevel: 10, supplierId: s1, totalSold: 290 },
    { name: "Iodized Table Salt", description: "Fortified iodized salt, essential for healthy cooking.", price: "1500", categoryId: condId, unit: "1kg pack", stockQuantity: 200, minStockLevel: 50, supplierId: s2, totalSold: 450 },
    { name: "Tomato Paste (Tins)", description: "Rich concentrated tomato paste for authentic Nigerian stews.", price: "4500", originalPrice: "5000", categoryId: condId, unit: "12-pack (400g each)", stockQuantity: 70, minStockLevel: 20, supplierId: s2, discountPercent: 10, totalSold: 300 },
    { name: "Wheat Flour (All-Purpose)", description: "Premium all-purpose flour for bread, pastries, and thickening.", price: "16000", categoryId: flourId, unit: "25kg bag", stockQuantity: 30, minStockLevel: 10, supplierId: s1, totalSold: 75 },
    { name: "Raw Groundnuts", description: "Fresh unroasted groundnuts, versatile for cooking, snacking, and oil extraction.", price: "12500", categoryId: legId, unit: "25kg bag", stockQuantity: 0, minStockLevel: 5, supplierId: s3, totalSold: 210 },
    { name: "Garri (Ijebu Type)", description: "Finely grained Ijebu garri, less sour and fine-textured.", price: "9000", categoryId: grainId, unit: "25kg bag", stockQuantity: 55, minStockLevel: 15, supplierId: s3, totalSold: 175 },
    { name: "Palm Oil", description: "Fresh raw red palm oil, essential for traditional Nigerian cooking.", price: "6800", categoryId: oilId, unit: "5L bottle", stockQuantity: 8, minStockLevel: 12, supplierId: s2, totalSold: 265 },
  ];

  const products = await db.insert(productsTable).values(productData).onConflictDoNothing().returning();

  // Customers
  const customerPassHash = await bcrypt.hash("test1234", 10);
  const customerData = [
    { name: "Amaka Okonkwo", email: "amaka@example.com", phone: "+234 801 111 2222", passwordHash: customerPassHash, role: "customer", loyaltyPoints: 120 },
    { name: "Bello Ismaila", email: "bello@example.com", phone: "+234 802 222 3333", passwordHash: customerPassHash, role: "customer", loyaltyPoints: 85 },
    { name: "Ngozi Eze", email: "ngozi@example.com", phone: "+234 803 333 4444", passwordHash: customerPassHash, role: "customer", loyaltyPoints: 200 },
    { name: "Taiwo Adewale", email: "taiwo@example.com", phone: "+234 804 444 5555", passwordHash: customerPassHash, role: "customer", loyaltyPoints: 50 },
    { name: "Fatima Garba", email: "fatima@example.com", phone: "+234 805 555 6666", passwordHash: customerPassHash, role: "customer", loyaltyPoints: 160 },
  ];
  const customers = await db.insert(usersTable).values(customerData).onConflictDoNothing().returning();

  // Staff
  const staffHash = await bcrypt.hash("staff123", 10);
  const staffData = [
    { name: "Samuel Taiwo", email: "samuel@greenbasket.com", role: "staff", pin: "1234", isActive: true },
    { name: "Grace Adeola", email: "grace@greenbasket.com", role: "delivery", pin: "5678", isActive: true },
  ];
  await db.insert(usersTable).values(staffData.map(s => ({ ...s, passwordHash: staffHash }))).onConflictDoNothing();
  await db.insert(staffTable).values(staffData).onConflictDoNothing();

  // Orders
  if (customers.length > 0 && products.length > 0) {
    const orderData = [
      { customerId: customers[0]!.id, subtotal: "53500", discount: "0", total: "53500", status: "delivered", paymentMethod: "cash_on_delivery", deliveryType: "delivery", deliveryAddress: "10 Aba Road, Port Harcourt" },
      { customerId: customers[1]!.id, subtotal: "22000", discount: "2000", total: "20000", status: "out_for_delivery", paymentMethod: "bank_transfer", deliveryType: "delivery", deliveryAddress: "5 Broad Street, Lagos", promoCode: "SAVE10" },
      { customerId: customers[2]!.id, subtotal: "45000", discount: "0", total: "45000", status: "confirmed", paymentMethod: "mobile_money", deliveryType: "pickup" },
      { customerId: customers[3]!.id, subtotal: "17000", discount: "1700", total: "15300", status: "pending", paymentMethod: "cash_on_delivery", deliveryType: "delivery", deliveryAddress: "7 Herbert Macaulay Way, Abuja", promoCode: "WELCOME10" },
      { customerId: customers[4]!.id, subtotal: "31200", discount: "0", total: "31200", status: "packed", paymentMethod: "bank_transfer", deliveryType: "delivery", deliveryAddress: "22 New Market Road, Onitsha" },
    ];
    const orders = await db.insert(ordersTable).values(orderData).onConflictDoNothing().returning();

    if (orders.length > 0) {
      await db.insert(orderItemsTable).values([
        { orderId: orders[0]!.id, productId: products[0]!.id, productName: products[0]!.name, unit: products[0]!.unit, quantity: 1, price: products[0]!.price },
        { orderId: orders[0]!.id, productId: products[1]!.id, productName: products[1]!.name, unit: products[1]!.unit, quantity: 1, price: products[1]!.price },
        { orderId: orders[1]!.id, productId: products[5]!.id, productName: products[5]!.name, unit: products[5]!.unit, quantity: 1, price: products[5]!.price },
        { orderId: orders[2]!.id, productId: products[0]!.id, productName: products[0]!.name, unit: products[0]!.unit, quantity: 1, price: products[0]!.price },
        { orderId: orders[3]!.id, productId: products[7]!.id, productName: products[7]!.name, unit: products[7]!.unit, quantity: 2, price: products[7]!.price },
        { orderId: orders[4]!.id, productId: products[3]!.id, productName: products[3]!.name, unit: products[3]!.unit, quantity: 1, price: products[3]!.price },
        { orderId: orders[4]!.id, productId: products[8]!.id, productName: products[8]!.name, unit: products[8]!.unit, quantity: 1, price: products[8]!.price },
      ]).onConflictDoNothing();
    }
  }

  // Expenses
  const today = new Date();
  const monthStr = today.toISOString().slice(0, 7);
  await db.insert(expensesTable).values([
    { category: "rent", amount: "150000", description: "Monthly warehouse rent", date: `${monthStr}-01` },
    { category: "electricity", amount: "35000", description: "PHCN/Generator fuel", date: `${monthStr}-05` },
    { category: "salaries", amount: "280000", description: "Staff salaries for the month", date: `${monthStr}-28` },
    { category: "transport", amount: "45000", description: "Delivery vehicle fuel and maintenance", date: `${monthStr}-10` },
    { category: "packaging", amount: "22000", description: "Polythene bags, stickers, tape", date: `${monthStr}-12` },
  ]).onConflictDoNothing();

  // Promo codes
  await db.insert(promoCodesTable).values([
    { code: "WELCOME10", type: "percent", value: "10", maxUses: 100, usageCount: 5, isActive: true },
    { code: "SAVE500", type: "fixed", value: "500", maxUses: 50, usageCount: 2, isActive: true },
    { code: "FLASH20", type: "percent", value: "20", maxUses: 30, usageCount: 0, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0], isActive: true },
  ]).onConflictDoNothing();

  // Activity
  await db.insert(activityTable).values([
    { type: "order_placed", message: "Order #1 placed by Amaka Okonkwo — ₦53,500" },
    { type: "order_placed", message: "Order #2 placed by Bello Ismaila — ₦20,000" },
    { type: "order_status", message: "Order #1 status changed to delivered" },
    { type: "stock_import", message: "120 units imported into Long Grain Parboiled Rice" },
    { type: "order_placed", message: "Order #3 placed by Ngozi Eze — ₦45,000" },
  ]).onConflictDoNothing();

  // Notifications
  await db.insert(notificationsTable).values([
    { type: "low_stock", message: "White Granulated Sugar is running low (5 units left)", isRead: false },
    { type: "low_stock", message: "Palm Oil is low on stock (8 units left)", isRead: false },
    { type: "order_placed", message: "New order #3 placed by Ngozi Eze", isRead: false },
    { type: "order_status", message: "Order #1 has been delivered", isRead: true },
  ]).onConflictDoNothing();

  console.log("Seeding complete!");
  console.log("Admin login: admin@greenbasket.com / admin123");
  console.log("Customer login: amaka@example.com / test1234");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
