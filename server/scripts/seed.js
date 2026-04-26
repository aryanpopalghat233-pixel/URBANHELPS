require("dotenv").config();
const connectDB = require("../config/database");
const { User, Service } = require("../models");

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});

    // Create sample users
    const customers = await User.create([
      {
        name: "John Customer",
        email: "customer@test.com",
        password: "password",
        phone: "9876543210",
        role: "customer",
        verified: true
      }
    ]);

    const workers = await User.create([
      {
        name: "Raj Worker",
        email: "worker@test.com",
        password: "password",
        phone: "9123456789",
        role: "worker",
        verified: true,
        rating: 4.8,
        status: "available"
      }
    ]);

    // Create sample services
    const services = await Service.create([
      { name: "Home Cleaning", icon: "🧹", price: 499 },
      { name: "AC Repair", icon: "❄️", price: 799 },
      { name: "Plumbing", icon: "🔧", price: 599 },
      { name: "Cooking", icon: "👨‍🍳", price: 999 },
      { name: "Electrical", icon: "⚡", price: 599 },
      { name: "Carpentry", icon: "🪛", price: 699 }
    ]);

    console.log(`
✅ Database seeded successfully!
📝 Customers: ${customers.length}
👷 Workers: ${workers.length}
🛎️  Services: ${services.length}
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
