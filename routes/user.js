const express = require('express');
const bcrypt = require('twin-bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const File = require('../models/file');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const secret = 'secret';

  User.findOne({ email }, (err, user) => {
    if(err) res.status(400).send('Can\'t log user in');
    if(!user) res.status(401).send('Can\'t log user in, it doesn\'t exist');
    else {
      bcrypt.compare(password, user.password, function(result) {
        if(result) {
          const token = jwt.sign({ id: user._id }, secret);
          return res.status(200).json({
            auth: true, token, user
          });
        }
        return res.status(401).send('Can\'t log user in, it doesn\'t exist');
      });
    }
  });
});

router.get('/', (req, res) => {
  User.getAllUsers((err, users) => {
    if(err) {
      console.log(err);
      res.status(400).send('Can\'t find all users \n');
    }
    res.status(200).json(users);
  });
});

router.get('/:id', (req, res) => {
  User.getUserById(req.params.id, (err, user) => {
    if(err) {
      console.log(err);
      res.status(400).send('Can\'t find the user with that id \n');
    }
    res.status(200).json(user);
  });
});

router.post('/', (req, res) => {
  const {
    name, email, password
  } = req.body;

  const newUser = {};
  newUser.name = name;
  newUser.email = email;

  if(password !== undefined && password !== '') {
    newUser.password = bcrypt.hashSync(password, 10);
  } else {
    newUser.password = undefined;
  }

  User.addUser(newUser, (err, user) => {
    if(err) {
      console.log(err);
      res.status(400).send('Can\'t create the user \n');
    }

    const newFile = {};
    newFile.owner = user._id;
    newFile.name = `ROOT ${user.name.split(" ")[0]}`
    newFile.type = 1;

    File.addFile(newFile, (err, fileRes) => {
      if(err) {
        console.log(err);
        res.status(400).send('Can\'t create the User File Root \n');
      }

      File.getRootSystem((errFather, fileFather) => {
        if(errFather) {
          console.log(errFather);
          res.status(400).send('Can\'t create the User File Root \n');
        }

        const updateFile = {};
        updateFile.children = fileFather.children.concat([fileRes._id]);

        File.updateFile(fileFather._id, updateFile, (errorFather) => {
          if(errorFather) {
            console.log(errorFather);
            res.status(400).send('Can\'t create the File \n');
          }
        });
      });

      user.folder = fileRes._id;
      user.save();
      res.status(200).json(user);
    });
  });
});

router.put('/', (req, res) => {
  const {
    id, name, email, shared_files, folder, password, image
  } = req.body;

  const updatedUser = {};

  if(password !== undefined && password !== '') {
    updatedUser.password = bcrypt.hashSync(password, 10);
  } else {
    updatedUser.password = undefined;
  }

  updatedUser.name = name;
  updatedUser.email = email;
  updatedUser.folder = folder;
  updatedUser.image = image;
  updatedUser.shared_files = shared_files;

  User.updateUser(id, updatedUser, (err, user) => {
    if(err) {
      console.log(err);
      res.status(400).send('Can\'t update this user \n');
    }
    res.status(200).json(user);
  });
});

router.delete('/:id', (req, res) => {
  User.deleteUser(req.params.id, (err, user) => {
    if(err) {
      console.log(err);
      res.status(400).send('Can\'t delete this user \n');
    }
    res.status(200).json(user);
  });
});

module.exports = router;