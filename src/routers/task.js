const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");

const router = new express.Router();

// For creating a new task
router.post("/tasks", auth, async (req, res) => {
  // Create a new task by calling constructor function
  // const task = new Task(req.body);

  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  // Save the data into database
  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
  // task
  //   .save()
  //   .then(() => {
  //     res.status(201).send(task);
  //   })
  //   .catch((error) => {
  //     res.status(400).send(error);
  //   });
});

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt:desc
// For reading all tasks
router.get("/tasks", auth, async (req, res) => {
  try {
    // const tasks = await Task.find({ owner: req.user._id });
    const match = {};
    const sort = {};

    if (req.query.completed) {
      match.completed = req.query.completed === "true";
    }

    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(":");
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    }

    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send();
  }
  // Task.find({})
  //   .then((tasks) => {
  //     res.send(tasks);
  //   })
  //   .catch((error) => {
  //     res.status(500).send();
  //   });
});

// For reading a single task
router.get("/tasks/:id", auth, async (req, res) => {
  // By the above method :id we can grab the id passed in the link
  const _id = req.params.id;

  try {
    // const task = await Task.findById(_id);

    const task = await Task.findOne({ _id, owner: req.user._id });

    // If user is not present
    if (!task) {
      return res.status(404).send();
    }
    // If user is present
    res.send(task);
  } catch (error) {
    // If some server error occurs
    res.status(500).send(error);
  }
  // Task.findById(_id)
  //   .then((task) => {
  //     if (!task) {
  //       return res.status(404).send();
  //     }

  //     res.send(task);
  //   })
  //   .catch((error) => {
  //     res.status(500).send();
  //   });
});

// For updating a task
router.patch("/tasks/:id", auth, async (req, res) => {
  // Additional validation
  // If a different key is passed which is not in the database to update

  // Grab the key provided by the client
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];

  // Check if all keys are present or not
  const isValidOperation = updates.every((item) =>
    allowedUpdates.includes(item)
  );

  // If any key is not present then return an error
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    // const task = await Task.findById(req.params.id);

    // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    //   // for creating new user
    //   new: true,
    //   // for validating the updated input
    //   runValidators: true,
    // });

    // If user is not found
    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((item) => (task[item] = req.body[item]));
    await task.save();

    // If user is found
    res.send(task);
  } catch (error) {
    // If some error occurs while fetching database
    res.status(400).send();
  }
});

// For deleting a task
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    // const task = await Task.findByIdAndDelete(req.params.id);

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    // If user is not found
    if (!task) {
      return res.status(404).send();
    }

    // If user is found
    res.send(task);
  } catch (error) {
    // If some server error occurs
    res.status(500).send();
  }
});

module.exports = router;
