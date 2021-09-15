const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const { sendWelcomeEmail, sendCancelEmail } = require("../emails/account");

const router = new express.Router();

// For adding a new user
router.post("/users", async (req, res) => {
  // Create a new task by calling constructor function
  const user = new User(req.body);

  // Save the data into database
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login router
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

// Logout Router
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// LogoutAll router
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// For reading a specific user details
// router.get("/users/:id", async (req, res) => {
//   // By the above method :id we can grab the id passed in the link
//   const _id = req.params.id;

//   try {
//     const user = await User.findById(_id);

//     // If user is not present
//     if (!user) {
//       return res.status(404).send();
//     }

//     // If user is present
//     res.send(user);
//   } catch (error) {
//     // If some server error occurs
//     res.status(500).send();
//   }
// });

// For updating a user details
router.patch("/users/me", auth, async (req, res) => {
  // Additional validation
  // If a different key is passed which is not in the database to update

  // Grab the key provided by the client
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "age", "password"];

  // Check if all keys are present or not
  const isValidOperation = updates.every((item) =>
    allowedUpdates.includes(item)
  );

  // If any key is not present then return an error
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    // const user = await User.findById(req.params.id);
    updates.forEach((item) => (req.user[item] = req.body[item]));
    await req.user.save();

    // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    //   // for creating new user
    //   new: true,
    //   // for validating the updated input
    //   runValidators: true,
    // });

    // If user is not found
    // if (!user) {
    //   return res.status(404).send();
    // }

    // If user is found
    res.send(req.user);
  } catch (error) {
    // If some error occurs while fetching database
    res.status(400).send(error);
  }
});

// For deleting a user
router.delete("/users/me", auth, async (req, res) => {
  try {
    // const user = await User.findByIdAndDelete(req.user._id);

    // // If user not found
    // if (!user) {
    //   return res.status(404).send();
    // }

    await req.user.remove();
    sendCancelEmail(req.user.email, req.user.name);
    // If user is found
    res.send(req.user);
  } catch (error) {
    // If some server error occurs
    res.status(500).send();
  }
});

// Use multer to add options and validation to img
const upload = multer({
  limits: {
    fileSize: 1000000, // 1 MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  },
});

// Upload the profile pic
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    // Rsize the image and set its extension to png
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// Delete the profile pic
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

// Get the uploaded profile pic
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/jpg");
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

module.exports = router;
