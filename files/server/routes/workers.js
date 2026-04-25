// ============================================
// WORKERS ROUTES
// ============================================
const express = require("express");
const { Worker, Booking } = require("../models/database");

const router = express.Router();

// ============================================
// GET ALL WORKERS
// ============================================
router.get("/all", (req, res) => {
  try {
    const workers = Worker.findAll();

    const workersWithBookings = workers.map((worker) => {
      const bookings = Booking.findAll().filter(
        (b) => b.workerId === worker.id && b.status !== "completed"
      );
      return {
        ...worker,
        activeBookings: bookings.length
      };
    });

    res.json({
      success: true,
      workers: workersWithBookings
    });
  } catch (error) {
    console.error("Error fetching workers:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching workers" 
    });
  }
});

// ============================================
// GET WORKER BY ID
// ============================================
router.get("/:workerId", (req, res) => {
  try {
    const { workerId } = req.params;
    const worker = Worker.findById(workerId);

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found" 
      });
    }

    res.json({
      success: true,
      worker
    });
  } catch (error) {
    console.error("Error fetching worker:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching worker" 
    });
  }
});

// ============================================
// GET WORKER BOOKINGS
// ============================================
router.get("/:workerId/bookings", (req, res) => {
  try {
    const { workerId } = req.params;
    const allBookings = Booking.findAll();
    const workerBookings = allBookings.filter((b) => b.workerId === workerId);

    res.json({
      success: true,
      bookings: workerBookings
    });
  } catch (error) {
    console.error("Error fetching worker bookings:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching bookings" 
    });
  }
});

// ============================================
// UPDATE WORKER STATUS
// ============================================
router.post("/update-status", (req, res) => {
  try {
    const { workerId, status } = req.body;

    if (!workerId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: "Worker ID and status required" 
      });
    }

    const worker = Worker.update(workerId, { status });

    res.json({
      success: true,
      message: "Worker status updated",
      worker
    });
  } catch (error) {
    console.error("Error updating worker status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating status" 
    });
  }
});

// ============================================
// GET AVAILABLE WORKERS
// ============================================
router.get("/available/list", (req, res) => {
  try {
    const workers = Worker.findAll();
    const availableWorkers = workers.filter(
      (w) => w.verified && (!w.status || w.status === "available")
    );

    res.json({
      success: true,
      workers: availableWorkers
    });
  } catch (error) {
    console.error("Error fetching available workers:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching workers" 
    });
  }
});

module.exports = router;