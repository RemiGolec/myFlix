const express = require('express'),
  morgan = require('morgan'),
  mongoose = require('mongoose'),
  Models = require('./models.js'),
  bodyParser = require('body-parser'),
  { check, validationResult } = require('express-validator');

const app = express(),
  Movies = Models.Movie,
  Users = Models.User,
  Genres = Models.Genre,
  Directors = Models.Director,
  cors = require('cors');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));
app.use(express.static('public'));

let allowedOrigins =
  [
    'http://localhost:8080',
    'http://testsite.com',
    'http://localhost:1234'
  ];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      let message = 'The CORS policy for this application doesn’t allow access from origin '
        + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

// ------- LOCALHOST CONNECTION STRING for testing purposes ------ //

//mongoose.connect('mongodb://localhost:27017/myFlixDB', {useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let auth = require('./auth')(app);//This ensures that Express is available in “auth.js” file as well.

const passport = require('passport');
require('./passport');



// -------  return a LIST of ALL MOVIES
app.get('/movies',
  // ------  temporarily removed for easy access movies from myFlix-client 
  // passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


// --------  return a SINGLE MOVIE by title
app.get('/movies/:Title',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
        res.status(201).json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error ' + err);
      });
  });

// -------  get GENRE by name
app.get('/genre/:Name/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Genres.findOne({ Name: req.params.Name })
      .then((genre) => {
        res.status(201).json(genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error ' + err);
      });
  });

// -------  return selected by name DIRECTOR's BIO 
app.get('/directors/:Name',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Directors.findOne({ Name: req.params.Name })
      .then((director) => {
        res.status(201).json(director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error ' + err);
      });
  });

// -------  read data about all users
app.get('/users',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

// -------  read data of a user by username
app.get('/users/:Username',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  })


// ------  allow new user to register
app.post('/users',
  check('Username', 'Username min 5 char is required').isLength({ min: 5 }),
  check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlpha('en-US', { ignore: ' ' }),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail(),
  check('Birthday', 'Req format YYYY-MM-DD').isDate({ format: 'YYYY-MM-DD' }),
  (req, res) => {

    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);

    Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + ' already exists ');
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

// -------  allow user to update their details
app.put('/users/:Username',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username },
      {
        $set:
        {
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        }
      },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
        } else {
          res.json(updatedUser);
        }
      });
  });

// -------- allow user to add movie to their list of favourites
app.post('/users/:Username/movies/:MovieID',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {

    Users.findOneAndUpdate({ Username: req.params.Username }, {
      //$addToSet used instead of $push to avoid duplication
      $addToSet: { FavouriteMovies: req.params.MovieID }
    },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
        } else {
          res.json(updatedUser);
          return res.status(201).send(req.body.Username + ' favourite movies list has been updated. ');
        }
      });
  });


// -------  allow user to remove a movie from their list of favourites
app.delete('/users/:Username/movies/:MovieID',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
      $pull: { FavouriteMovies: req.params.MovieID }
    },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
        } else {
          res.json(updatedUser);
        }
      });
  });

// ------- allow existing user to deregister by removing data
app.delete('/users/:Username',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + ' was not found');
        } else {
          res.status(200).send(req.params.Username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

app.get('/', (req, res) => {
  res.send('Welcome to my app!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('This app is listening on port ' + port);
});
