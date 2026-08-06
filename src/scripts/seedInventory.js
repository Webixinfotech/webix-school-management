/**
 * Seeds a comprehensive set of demo categories + items for the Inventory &
 * Library module — covering everything a school typically stocks: items
 * parents buy for their kids (uniform, stationery, art & craft, sports
 * gear) as well as items teachers need (whiteboard markers, registers,
 * lab equipment, etc.), so the endpoints in inventory.routes.js have
 * realistic data to return out of the box.
 *
 * Idempotent — safe to re-run; matches by name and updates instead of
 * duplicating.
 *
 * Usage:  npm run db:seed:inventory
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../modules/auth/user.model');
const ItemCategory = require('../modules/inventory/itemCategory.model');
const Item = require('../modules/inventory/item.model');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected: ${mongoose.connection.host}`);

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    throw new Error('No admin user found — create an admin account first, then re-run this script.');
  }
  console.log(`Using admin "${admin.name}" (${admin._id}) as createdBy`);

  const categoryDefs = [
    { name: 'Books', description: 'Story books, textbooks, workbooks, reference material', directIssueAllowed: false },
    { name: 'Toys', description: 'STEM kits, puzzles, building blocks', directIssueAllowed: false },
    // Category itself stays approval-required by default (Section 4.3) —
    // low-value consumables below get an item-level exemption instead,
    // matching the doc's own example (single-item exemption, not a
    // whole category).
    { name: 'Stationery', description: 'Pens, pencils, notebooks, glue, scissors and everyday writing supplies', directIssueAllowed: false },
    { name: 'Uniform', description: 'School uniform sets, ties, shoes, bags', directIssueAllowed: false },
    { name: 'Art & Craft', description: 'Crayons, colors, chart paper, craft supplies', directIssueAllowed: false },
    { name: 'Sports Equipment', description: 'Bats, balls, rackets and other sports gear', directIssueAllowed: false },
    { name: 'Teacher Supplies', description: 'Whiteboard markers, registers, staplers, classroom essentials for staff', directIssueAllowed: false },
    { name: 'Lab & Electronics', description: 'Calculators, geometry boxes, science lab kits, maps and charts', directIssueAllowed: false },
  ];

  const categories = {};
  for (const def of categoryDefs) {
    const category = await ItemCategory.findOneAndUpdate(
      { name: def.name },
      { $setOnInsert: { ...def, createdBy: admin._id } },
      { upsert: true, new: true },
    );
    categories[def.name] = category;
    console.log(`Category ready: ${category.name} (${category._id})`);
  }

  const itemDefs = [
    // ---------------- Books ----------------
    {
      name: 'Panchatantra Stories',
      category: categories.Books._id,
      itemTypes: ['lendable', 'sellable'],
      unit: 'piece',
      currentStock: 8,
      minStockLevel: 2,
      sellingPrice: 250,
      securityDepositAmount: 250,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Class 5 Mathematics Textbook',
      category: categories.Books._id,
      itemTypes: ['sellable'],
      unit: 'piece',
      currentStock: 60,
      minStockLevel: 10,
      sellingPrice: 180,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'English Grammar Workbook',
      category: categories.Books._id,
      itemTypes: ['sellable'],
      unit: 'piece',
      currentStock: 55,
      minStockLevel: 10,
      sellingPrice: 150,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Hindi Reader (Class 3)',
      category: categories.Books._id,
      itemTypes: ['sellable'],
      unit: 'piece',
      currentStock: 50,
      minStockLevel: 10,
      sellingPrice: 160,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: "Children's Encyclopedia",
      category: categories.Books._id,
      itemTypes: ['lendable'],
      unit: 'piece',
      currentStock: 5,
      minStockLevel: 1,
      sellingPrice: 600,
      securityDepositAmount: 600,
      isPublic: true,
    },
    {
      name: 'Moral Stories Picture Book',
      category: categories.Books._id,
      itemTypes: ['lendable', 'sellable'],
      unit: 'piece',
      currentStock: 12,
      minStockLevel: 3,
      sellingPrice: 120,
      securityDepositAmount: 100,
      availableForSale: true,
      isPublic: true,
    },

    // ---------------- Toys ----------------
    {
      name: 'Craft Kit',
      category: categories.Toys._id,
      itemTypes: ['lendable', 'sellable'],
      unit: 'piece',
      currentStock: 15,
      minStockLevel: 3,
      sellingPrice: 400,
      securityDepositAmount: 400,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Building Blocks Set',
      category: categories.Toys._id,
      itemTypes: ['lendable', 'sellable'],
      unit: 'piece',
      currentStock: 10,
      minStockLevel: 2,
      sellingPrice: 500,
      securityDepositAmount: 500,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Jigsaw Puzzle (100 pcs)',
      category: categories.Toys._id,
      itemTypes: ['lendable', 'sellable'],
      unit: 'piece',
      currentStock: 12,
      minStockLevel: 3,
      sellingPrice: 220,
      securityDepositAmount: 150,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'STEM Robotics Kit',
      category: categories.Toys._id,
      itemTypes: ['lendable'],
      unit: 'piece',
      currentStock: 6,
      minStockLevel: 1,
      sellingPrice: 1500,
      securityDepositAmount: 1500,
      isPublic: true,
    },

    // ---------------- Stationery ----------------
    {
      name: 'Pencil',
      category: categories.Stationery._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 200,
      minStockLevel: 30,
      sellingPrice: 5,
      directIssueOverride: true,
    },
    {
      name: 'Eraser',
      category: categories.Stationery._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 150,
      minStockLevel: 20,
      sellingPrice: 3,
      directIssueOverride: true,
    },
    {
      name: 'Sharpener',
      category: categories.Stationery._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 120,
      minStockLevel: 20,
      sellingPrice: 5,
      directIssueOverride: true,
    },
    {
      name: 'Ball Pen - Blue',
      category: categories.Stationery._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 180,
      minStockLevel: 30,
      sellingPrice: 8,
      directIssueOverride: true,
    },
    {
      name: 'Marker - Blue',
      category: categories.Stationery._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 40,
      minStockLevel: 20,
      sellingPrice: 15,
    },
    {
      name: 'Notebook - 200 Pages (Single Line)',
      category: categories.Stationery._id,
      itemTypes: ['consumable', 'sellable'],
      unit: 'piece',
      currentStock: 100,
      minStockLevel: 20,
      sellingPrice: 40,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Four Line Notebook (Class 1-2)',
      category: categories.Stationery._id,
      itemTypes: ['consumable', 'sellable'],
      unit: 'piece',
      currentStock: 90,
      minStockLevel: 20,
      sellingPrice: 35,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Scale/Ruler (15cm)',
      category: categories.Stationery._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 80,
      minStockLevel: 15,
      sellingPrice: 10,
    },
    {
      name: 'Glue Stick',
      category: categories.Stationery._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 70,
      minStockLevel: 15,
      sellingPrice: 20,
    },
    {
      name: 'Scissors (Kids Safety)',
      category: categories.Stationery._id,
      itemTypes: ['consumable', 'sellable'],
      unit: 'piece',
      currentStock: 45,
      minStockLevel: 10,
      sellingPrice: 30,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'School Diary/Planner',
      category: categories.Stationery._id,
      itemTypes: ['sellable'],
      unit: 'piece',
      currentStock: 60,
      minStockLevel: 15,
      sellingPrice: 60,
      availableForSale: true,
      isPublic: true,
    },

    // ---------------- Uniform ----------------
    {
      name: 'Summer Uniform Set',
      category: categories.Uniform._id,
      itemTypes: ['sellable'],
      unit: 'set',
      currentStock: 25,
      minStockLevel: 5,
      sellingPrice: 900,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Winter Uniform Set',
      category: categories.Uniform._id,
      itemTypes: ['sellable'],
      unit: 'set',
      currentStock: 20,
      minStockLevel: 5,
      sellingPrice: 1400,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'PT/Sports Uniform Set',
      category: categories.Uniform._id,
      itemTypes: ['sellable'],
      unit: 'set',
      currentStock: 20,
      minStockLevel: 5,
      sellingPrice: 750,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'School Tie',
      category: categories.Uniform._id,
      itemTypes: ['sellable'],
      unit: 'piece',
      currentStock: 40,
      minStockLevel: 10,
      sellingPrice: 100,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'School Belt',
      category: categories.Uniform._id,
      itemTypes: ['sellable'],
      unit: 'piece',
      currentStock: 40,
      minStockLevel: 10,
      sellingPrice: 120,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'School Shoes',
      category: categories.Uniform._id,
      itemTypes: ['sellable'],
      unit: 'pair',
      currentStock: 30,
      minStockLevel: 5,
      sellingPrice: 650,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'School Bag',
      category: categories.Uniform._id,
      itemTypes: ['sellable'],
      unit: 'piece',
      currentStock: 25,
      minStockLevel: 5,
      sellingPrice: 850,
      availableForSale: true,
      isPublic: true,
    },

    // ---------------- Art & Craft ----------------
    {
      name: 'Crayons Box (12 Colors)',
      category: categories['Art & Craft']._id,
      itemTypes: ['consumable', 'sellable'],
      unit: 'box',
      currentStock: 60,
      minStockLevel: 15,
      sellingPrice: 45,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Color Pencils (24 Shades)',
      category: categories['Art & Craft']._id,
      itemTypes: ['consumable', 'sellable'],
      unit: 'box',
      currentStock: 50,
      minStockLevel: 10,
      sellingPrice: 120,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Water Color Box',
      category: categories['Art & Craft']._id,
      itemTypes: ['consumable', 'sellable'],
      unit: 'box',
      currentStock: 40,
      minStockLevel: 10,
      sellingPrice: 90,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Chart Paper (Sheet)',
      category: categories['Art & Craft']._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 200,
      minStockLevel: 40,
      sellingPrice: 10,
      directIssueOverride: true,
    },
    {
      name: 'Drawing Book',
      category: categories['Art & Craft']._id,
      itemTypes: ['consumable', 'sellable'],
      unit: 'piece',
      currentStock: 70,
      minStockLevel: 15,
      sellingPrice: 50,
      availableForSale: true,
      isPublic: true,
    },

    // ---------------- Sports Equipment ----------------
    {
      name: 'Cricket Bat',
      category: categories['Sports Equipment']._id,
      itemTypes: ['lendable'],
      unit: 'piece',
      currentStock: 8,
      minStockLevel: 2,
      sellingPrice: 700,
      securityDepositAmount: 700,
      isPublic: true,
    },
    {
      name: 'Football',
      category: categories['Sports Equipment']._id,
      itemTypes: ['lendable'],
      unit: 'piece',
      currentStock: 10,
      minStockLevel: 2,
      sellingPrice: 600,
      securityDepositAmount: 600,
      isPublic: true,
    },
    {
      name: 'Skipping Rope',
      category: categories['Sports Equipment']._id,
      itemTypes: ['lendable', 'sellable'],
      unit: 'piece',
      currentStock: 25,
      minStockLevel: 5,
      sellingPrice: 80,
      securityDepositAmount: 50,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Badminton Racket Set',
      category: categories['Sports Equipment']._id,
      itemTypes: ['lendable'],
      unit: 'set',
      currentStock: 6,
      minStockLevel: 1,
      sellingPrice: 500,
      securityDepositAmount: 500,
      isPublic: true,
    },
    {
      name: 'Chess Set',
      category: categories['Sports Equipment']._id,
      itemTypes: ['lendable'],
      unit: 'piece',
      currentStock: 10,
      minStockLevel: 2,
      sellingPrice: 300,
      securityDepositAmount: 300,
      isPublic: true,
    },

    // ---------------- Teacher Supplies ----------------
    {
      name: 'Whiteboard Marker (Black)',
      category: categories['Teacher Supplies']._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 60,
      minStockLevel: 15,
      sellingPrice: 20,
      directIssueOverride: true,
    },
    {
      name: 'Whiteboard Duster',
      category: categories['Teacher Supplies']._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 30,
      minStockLevel: 5,
      sellingPrice: 25,
      directIssueOverride: true,
    },
    {
      name: 'Chalk Box',
      category: categories['Teacher Supplies']._id,
      itemTypes: ['consumable'],
      unit: 'box',
      currentStock: 50,
      minStockLevel: 10,
      sellingPrice: 15,
      directIssueOverride: true,
    },
    {
      name: 'Attendance Register',
      category: categories['Teacher Supplies']._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 20,
      minStockLevel: 5,
      sellingPrice: 60,
    },
    {
      name: 'Stapler with Pins',
      category: categories['Teacher Supplies']._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 15,
      minStockLevel: 3,
      sellingPrice: 90,
    },
    {
      name: 'Red Correction Pen',
      category: categories['Teacher Supplies']._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 40,
      minStockLevel: 10,
      sellingPrice: 10,
      directIssueOverride: true,
    },
    {
      name: 'File Folder',
      category: categories['Teacher Supplies']._id,
      itemTypes: ['consumable'],
      unit: 'piece',
      currentStock: 60,
      minStockLevel: 15,
      sellingPrice: 20,
    },

    // ---------------- Lab & Electronics ----------------
    {
      name: 'Scientific Calculator',
      category: categories['Lab & Electronics']._id,
      itemTypes: ['sellable'],
      unit: 'piece',
      currentStock: 30,
      minStockLevel: 5,
      sellingPrice: 450,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Geometry Box',
      category: categories['Lab & Electronics']._id,
      itemTypes: ['sellable'],
      unit: 'piece',
      currentStock: 40,
      minStockLevel: 10,
      sellingPrice: 150,
      availableForSale: true,
      isPublic: true,
    },
    {
      name: 'Science Lab Kit (Physics)',
      category: categories['Lab & Electronics']._id,
      itemTypes: ['lendable'],
      unit: 'piece',
      currentStock: 5,
      minStockLevel: 1,
      sellingPrice: 2000,
      securityDepositAmount: 2000,
      isPublic: true,
    },
    {
      name: 'World Map Chart',
      category: categories['Lab & Electronics']._id,
      itemTypes: ['lendable'],
      unit: 'piece',
      currentStock: 8,
      minStockLevel: 2,
      sellingPrice: 300,
      securityDepositAmount: 200,
      isPublic: true,
    },
    {
      name: 'Classroom Globe',
      category: categories['Lab & Electronics']._id,
      itemTypes: ['lendable'],
      unit: 'piece',
      currentStock: 6,
      minStockLevel: 1,
      sellingPrice: 550,
      securityDepositAmount: 550,
      isPublic: true,
    },
  ];

  for (const def of itemDefs) {
    const item = await Item.findOneAndUpdate(
      { name: def.name },
      { $setOnInsert: { ...def, createdBy: admin._id } },
      { upsert: true, new: true },
    );
    console.log(`Item ready: ${item.name} (${item._id})`);
  }

  console.log(`\nSeed complete. ${categoryDefs.length} categories, ${itemDefs.length} items.`);
  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });