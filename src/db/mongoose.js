const mongoose = require("mongoose");

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

// const me = new User({
//   name: "    Akshat     ",
//   email: " AKSHAT@gmail.com   ",
//   password: "akshat@12212",
// });

// me.save()
//   .then(() => {
//     console.log(me);
//   })
//   .catch((error) => {
//     console.log("Error: ", error);
//   });

// const Tasks = mongoose.model("Tasks", {
//   description: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   completed: {
//     type: Boolean,
//     default: false,
//   },
// });

// const task = new Tasks({
//   description: "Complete react.js             ",
// });

// task
//   .save()
//   .then(() => console.log(task))
//   .catch((error) => console.log(error));
