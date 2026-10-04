const bcrypt = require("bcryptjs");

const password = "123456";

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log("Hashed password:");
  console.log(hash);
});