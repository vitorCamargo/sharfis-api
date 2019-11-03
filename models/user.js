const mongoose = require('mongoose');
const uniquevalidator = require('mongoose-unique-validator');

const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String },
  image: { type: String, default: 'https://res.cloudinary.com/dnnkqjrbi/image/upload/v1569545813/images_jxiacp.png', required: true },
}, { timestamps: true });

UserSchema.plugin(uniquevalidator);

const User = mongoose.model('User', UserSchema, 'Users');

module.exports = User;

module.exports.getAllUsers = (callback) => {
  User.find(callback);
};

module.exports.getUserById = (id, callback) => {
  User.findOne({ _id: id }, callback);
};

module.exports.addUser = (user, callback) => {
  const newUser = new User();

  newUser.name = user.name;
  newUser.email = user.email;
  newUser.username = user.username;
  newUser.password = user.password;

  newUser.save(callback);
};

module.exports.updateUser = (id, updatedUser, callback) => {
  User.getUserById(id, (err, user) => {
    if(err) callback(err, null);

    user.name = updatedUser.name ? updatedUser.name : user.name;
    user.email = updatedUser.email ? updatedUser.email : user.email;
    user.username = updatedUser.username ? updatedUser.username : user.username;
    user.password = updatedUser.password ? updatedUser.password : user.password;
    user.image = updatedUser.image ? updatedUser.image : user.image;

    user.save(callback);
  });
};

module.exports.deleteUser = (id, callback) => {
  User.deleteOne({ _id: id }, callback);
};
