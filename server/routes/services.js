// ============================================
// SERVICES ROUTES
// ============================================
const express = require("express");
const { Service } = require("../models");

const router = express.Router();

// ============================================
// GET ALL SERVICES
// ============================================
router.get("/all", async (req, res) => {
  try {
    const services = await Service.find({ active: true });

    res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching services"
    });
  }
});

// ============================================
// GET SERVICE BY ID
// ============================================
router.get("/:serviceId", async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    res.json({
      success: true,
      service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching service"
    });
  }
});

// ============================================
// GET SERVICES BY CATEGORY
// ============================================
router.get("/category/:category", async (req, res) => {
  try {
    const services = await Service.find({
      category: req.params.category,
      active: true
    });

    res.json({
      success: true,
      services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching services"
    });
  }
});

// ============================================
// CREATE SERVICE (ADMIN)
// ============================================
router.post("/create", async (req, res) => {
  try {
    const { name, icon, price, description, category, estimatedDuration, tags } = req.body;

    const service = await Service.create({
      name,
      icon,
      price,
      description,
      category,
      estimatedDuration,
      tags
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error creating service"
    });
  }
});

// ============================================
// UPDATE SERVICE (ADMIN)
// ============================================
router.put("/:serviceId", async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.serviceId,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Service updated successfully",
      service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating service"
    });
  }
});

// ============================================
// DEACTIVATE SERVICE (ADMIN)
// ============================================
router.post("/:serviceId/deactivate", async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.serviceId,
      { active: false },
      { new: true }
    );

    res.json({
      success: true,
      message: "Service deactivated",
      service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deactivating service"
    });
  }
});

module.exports = router;
