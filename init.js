const mongoose = require('mongoose');

// the run-rs command will by default start the replica sets on the following ports
const dbUri = 'mongodb+srv://dbUser:vF2eEctcBYK0ynFUHnBFlXpgZ@cluster0-8upbj.mongodb.net/sample_airbnb?retryWrites=true&w=majority';

async function init() {
  // connecting the DB
  await mongoose.connect(dbUri/*, { replicaSet: 'rs' }*/);

  // a simple mongoose model
  const userSchema = new mongoose.Schema({
    email: String, name: String 
  });
  const User = mongoose.model('User', userSchema);
  //User.createCollection();
  
  // creating two users
  await User.create([
            {
                email: "leslie@example.com",
                name: "Leslie Yepp"
            },
            {
                email: "april@example.com",
                name: "April Ludfence"
            },
            {
                email: "tom@example.com",
                name: "Tom Haverdodge"
            }  
  ]);

  // the following won't work for some reason... I had to do it manually in the shell
  // userSchema.index({ "email": 1 }, { unique: true });
}

module.exports = init;

init().catch(console.error);
