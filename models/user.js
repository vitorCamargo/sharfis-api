const mongoose = require('mongoose');
const uniquevalidator = require('mongoose-unique-validator');

const { Schema } = mongoose;

const UserSchema = new Schema({
  phone: { type: String, unique: true, required: true },
  cpf: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String },
  image: { type: String, default: 'https://res.cloudinary.com/dnnkqjrbi/image/upload/v1569545813/images_jxiacp.png', required: true },
  facebookID: { type: String, default: '', required: false },
  forms: [{
    form: { type: Schema.Types.ObjectId, ref: 'Form' },
    visitedAt: { type: Date, default: Date.now }
  }]
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

  newUser.phone = user.phone;
  newUser.cpf = user.cpf;
  newUser.name = user.name;
  newUser.facebookID = user.facebookID;
  newUser.forms = user.forms;
  newUser.password = user.password;

  newUser.save(callback);
};

module.exports.updateUser = (id, updatedUser, callback) => {
  User.getUserById(id, (err, user) => {
    if(err) callback(err, null);

    user.phone = updatedUser.phone ? updatedUser.phone : user.phone;
    user.cpf = updatedUser.cpf ? updatedUser.cpf : user.cpf;
    user.name = updatedUser.name ? updatedUser.name : user.name;
    user.password = updatedUser.password ? updatedUser.password : user.password;
    user.image = updatedUser.image ? updatedUser.image : user.image;
    user.facebookID = updatedUser.facebookID ? updatedUser.facebookID : user.facebookID;

    user.save(callback);
  });
};

module.exports.updateFormsUser = (id, forms, callback) => {
  User.getUserById(id, (err, user) => {
    if(err) callback(err, null);

    user.forms = forms;

    user.save(callback);
  });
};

module.exports.deleteUser = (id, callback) => {
  User.deleteOne({ _id: id }, callback);
};
