// ============================================
// ADMIN ROUTES
// ============================================
const express = require("express");
const { User, Booking, Worker, Service } = require("../models/database");

const router = express.Router();

// ============================================
// GET DASHBOARD STATS
// ============================================
router.get("/stats", (req, res) => {
  try {
    const allUsers = User.findAll();
    const workers = allUsers.filter((u) => u.role === "worker");
    const customers = allUsers.filter((u) => u.role === "customer");
    const bookings = Booking.findAll();

    const stats = {
      totalWorkers: workers.length,
      totalCustomers: customers.length,
      totalBookings: bookings.length,
      completedBookings: bookings.filter((b) => b.status === "completed").length,
      pendingBookings: bookings.filter((b) => b.status === "pending").length,
      totalServices: Service.findAll().length
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching statistics" 
    });
  }
});

// ============================================
// GET ALL USERS
// ============================================
router.get("/users", (req, res) => {
  try {
    const users = User.findAll();

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching users" 
    });
  }
});

// ============================================
// GET ALL BOOKINGS WITH DETAILS
// ============================================
router.get("/bookings", (req, res) => {
  try {
    const bookings = Booking.findAll();
    const bookingsWithDetails = bookings.map((booking) => {
      const worker = booking.workerId ? Worker.findById(booking.workerId) : null;
      const customer = User.findById(booking.customerId);
      const service = Service.findById(booking.serviceId);

      return {
        ...booking,
        workerName: worker?.name || "Unassigned",
        workerPhone: worker?.phone || "N/A",
        customerName: customer?.name || "Unknown",
        serviceName: service?.name || "Unknown"
      };
    });

    res.json({
      success: true,
      bookings: bookingsWithDetails
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching bookings" 
    });
  }
});

// ============================================
// GET ALL WORKERS WITH STATS
// ============================================
router.get("/workers-stats", (req, res) => {
  try {
    const workers = Worker.findAll();
    const bookings = Booking.findAll();

    const workerStats = workers.map((worker) => {
      const workerBookings = bookings.filter((b) => b.workerId === worker.id);
      const completedBookings = workerBookings.filter(
        (b) => b.status === "completed"
      ).length;

      return {
        ...worker,
        totalJobs: workerBookings.length,
        completedJobs: completedBookings,
        activeJobs: workerBookings.filter((b) => b.status !== "completed").length
      };
    });

    res.json({
      success: true,
      workers: workerStats
    });
  } catch (error) {
    console.error("Error fetching worker stats:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching worker statistics" 
    });
  }
});

module.exports = router;