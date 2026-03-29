const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// Get tasks for a specific date range
router.get("/", async (req, res) => {
  try {
    const { start, end } = req.query;
    let filter = {};
    if (start && end) {
      filter.date = { $gte: start, $lte: end };
    } else if (start) {
      filter.date = start;
    }
    const tasks = await Task.find(filter).sort({ date: 1, createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a task
router.post("/", async (req, res) => {
  try {
    const { title, date, category, notes, duration } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: "Title and date are required" });
    }
    const task = new Task({ title, date, category, notes, duration });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a task
router.put("/:id", async (req, res) => {
  try {
    const { title, completed, category, notes, duration } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (completed !== undefined) update.completed = completed;
    if (category !== undefined) update.category = category;
    if (notes !== undefined) update.notes = notes;
    if (duration !== undefined) update.duration = duration;
    const task = await Task.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
