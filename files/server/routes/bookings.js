// ============================================
// BOOKINGS ROUTES
// ============================================
const express = require("express");
const { Booking, Service, Worker } = require("../models/database");

const router = express.Router();

// ============================================
// CREATE BOOKING
// ============================================
router.post("/create", (req, res) => {
  try {
    const { customerId, serviceId, location, latitude, longitude, description } = req.body;

    if (!customerId || !serviceId || !location) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    const service = Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ 
        success: false, 
        message: "Service not found" 
      });
    }

    const booking = Booking.create({
      customerId,
      serviceId,
      location,
      latitude: latitude || 0,
      longitude: longitude || 0,
      description,
      price: service.price,
      status: "pending",
      workerId: null
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating booking" 
    });
  }
});

// ============================================
// GET CUSTOMER BOOKINGS
// ============================================
router.get("/customer/:customerId", (req, res) => {
  try {
    const { customerId } = req.params;
    const bookings = Booking.findByCustomerId(customerId);

    res.json({
      success: true,
      bookings
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
// GET ALL BOOKINGS
// ============================================
router.get("/all", (req, res) => {
  try {
    const bookings = Booking.findAll();

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching bookings" 
    });
  }
});

// ============================================
// ASSIGN WORKER TO BOOKING
// ============================================
router.post("/assign", (req, res) => {
  try {
    const { bookingId, workerId } = req.body;

    if (!bookingId || !workerId) {
      return res.status(400).json({ 
        success: false, 
        message: "Booking ID and Worker ID required" 
      });
    }

    const booking = Booking.update(bookingId, {
      workerId,
      status: "assigned"
    });

    res.json({
      success: true,
      message: "Worker assigned successfully",
      booking
    });
  } catch (error) {
    console.error("Error assigning worker:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error assigning worker" 
    });
  }
});

// ============================================
// UPDATE BOOKING STATUS
// ============================================
router.post("/update-status", (req, res) => {
  try {
    const { bookingId, status } = req.body;

    if (!bookingId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: "Booking ID and status required" 
      });
    }

    const booking = Booking.update(bookingId, { status });

    res.json({
      success: true,
      message: "Status updated successfully",
      booking
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating status" 
    });
  }
});

module.exports = router;