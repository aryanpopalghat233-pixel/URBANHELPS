// ============================================
// DATABASE MODELS (Using JSON files)
// ============================================
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "../../data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File paths
const FILES = {
  users: path.join(DATA_DIR, "users.json"),
  bookings: path.join(DATA_DIR, "bookings.json"),
  workers: path.join(DATA_DIR, "workers.json"),
  services: path.join(DATA_DIR, "services.json")
};

// Initialize files with default data
const initializeDatabase = () => {
  // Initialize users
  if (!fs.existsSync(FILES.users)) {
    const defaultUsers = [
      {
        id: "user_1",
        name: "John Customer",
        email: "customer@test.com",
        password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeS86E36P4/KFm", // password
        phone: "9876543210",
        role: "customer",
        createdAt: new Date()
      },
      {
        id: "worker_1",
        name: "Raj Worker",
        email: "worker@test.com",
        password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeS86E36P4/KFm",
        phone: "9123456789",
        role: "worker",
        verified: true,
        rating: 4.8,
        createdAt: new Date()
      }
    ];
    fs.writeFileSync(FILES.users, JSON.stringify(defaultUsers, null, 2));
  }

  // Initialize services
  if (!fs.existsSync(FILES.services)) {
    const defaultServices = [
      { id: "1", name: "Home Cleaning", icon: "🧹", price: 499 },
      { id: "2", name: "AC Repair", icon: "❄️", price: 799 },
      { id: "3", name: "Plumbing", icon: "🔧", price: 599 },
      { id: "4", name: "Cooking", icon: "👨‍🍳", price: 999 },
      { id: "5", name: "Electrical", icon: "⚡", price: 599 },
      { id: "6", name: "Carpentry", icon: "🪛", price: 699 }
    ];
    fs.writeFileSync(FILES.services, JSON.stringify(defaultServices, null, 2));
  }

  // Initialize bookings
  if (!fs.existsSync(FILES.bookings)) {
    fs.writeFileSync(FILES.bookings, JSON.stringify([], null, 2));
  }

  // Initialize workers
  if (!fs.existsSync(FILES.workers)) {
    fs.writeFileSync(FILES.workers, JSON.stringify([], null, 2));
  }
};

// Read data from JSON file
const readData = (fileType) => {
  try {
    const data = fs.readFileSync(FILES[fileType], "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${fileType}:`, error);
    return [];
  }
};

// Write data to JSON file
const writeData = (fileType, data) => {
  try {
    fs.writeFileSync(FILES[fileType], JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${fileType}:`, error);
    return false;
  }
};

// ============================================
// USER OPERATIONS
// ============================================
const User = {
  create: (userData) => {
    const users = readData("users");
    const newUser = {
      id: `user_${Date.now()}`,
      ...userData,
      createdAt: new Date()
    };
    users.push(newUser);
    writeData("users", users);
    return newUser;
  },

  findByEmail: (email) => {
    const users = readData("users");
    return users.find((u) => u.email === email);
  },

  findById: (id) => {
    const users = readData("users");
    return users.find((u) => u.id === id);
  },

  findAll: () => {
    return readData("users");
  }
};

// ============================================
// BOOKING OPERATIONS
// ============================================
const Booking = {
  create: (bookingData) => {
    const bookings = readData("bookings");
    const newBooking = {
      id: `booking_${Date.now()}`,
      ...bookingData,
      status: "pending",
      createdAt: new Date()
    };
    bookings.push(newBooking);
    writeData("bookings", bookings);
    return newBooking;
  },

  findById: (id) => {
    const bookings = readData("bookings");
    return bookings.find((b) => b.id === id);
  },

  findByCustomerId: (customerId) => {
    const bookings = readData("bookings");
    return bookings.filter((b) => b.customerId === customerId);
  },

  findAll: () => {
    return readData("bookings");
  },

  update: (id, updateData) => {
    const bookings = readData("bookings");
    const index = bookings.findIndex((b) => b.id === id);
    if (index !== -1) {
      bookings[index] = { ...bookings[index], ...updateData };
      writeData("bookings", bookings);
      return bookings[index];
    }
    return null;
  }
};

// ============================================
// WORKER OPERATIONS
// ============================================
const Worker = {
  findAll: () => {
    const users = readData("users");
    return users.filter((u) => u.role === "worker");
  },

  findById: (id) => {
    const users = readData("users");
    return users.find((u) => u.id === id && u.role === "worker");
  },

  update: (id, updateData) => {
    const users = readData("users");
    const index = users.findIndex((u) => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updateData };
      writeData("users", users);
      return users[index];
    }
    return null;
  }
};

// ============================================
// SERVICE OPERATIONS
// ============================================
const Service = {
  findAll: () => {
    return readData("services");
  },

  findById: (id) => {
    const services = readData("services");
    return services.find((s) => s.id === id);
  }
};

// Initialize database on startup
initializeDatabase();

module.exports = {
  User,
  Booking,
  Worker,
  Service,
  initializeDatabase
};