const express = require('express'),
  morgan = require('morgan'),
  mongoose = require('mongoose'),
  Models = require('./models.js'),
  bodyParser = require('body-parser'),
  // requires express validator to validate user input on the server side
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
    'http://localhost:1234',
    'https://dashboard.heroku.com/apps/morning-badlands-52426',
    'https://morning-badlands-52426.herokuapp.com',
    'https://remiflix.netlify.app/',
    'http://localhost:4200/'
  ];

app.use(cors());

// --------  This code on line 35-45 isctemporarily commented out
// --------  CORS was throwing errors after adding movie to favourites
// --------  It wasn't allowing authorisation of user at all

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) === -1) {
//       let message = 'The CORS policy for this application doesn’t allow access from origin '
//         + origin;
//       return callback(new Error(message), false);
//     }
//     return callback(null, true);
//   }
// }));

// ------- LOCALHOST CONNECTION STRING for testing purposes ------ //

//mongoose.connect('mongodb://localhost:27017/myFlixDB', {useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//This ensures that Express is available in “auth.js” file as well.
let auth = require('./auth')(app);

// requires the Passport module and imports passport.js
const passport = require('passport');
require('./passport');



// -------  return a LIST of ALL MOVIES
// READ route located at endpoint '/movies', returning .json object with all movies
/**
 * /movies end-point
 * method: get
 * get all movies
 * @param {express.request} req
 * @param {express.response} res
 */
app.get('/movies',

  passport.authenticate('jwt', { session: false }),
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
/**
 * /movies/:Title end-point
 * method: gt
 * movies by title
 * @param {express.request} req
 * @param {express.response} res
 */
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
/**
 * /genre end-point
 * method: get
 * get description of a genre by name
 * @param {express.request} req
 * @param {express.response} res
 */
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
/**
 * /directors end-point
 * method: get
 * director by name
 * @param {express.request} req
 * @param {express.response} res
 */
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

// -------  gets all users
/**
 * /users end-point
 * method: get
 * get all user profiles
 * @param {express.request} req
 * @param {express.response} res
 */
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

// -------  gets a user by username
/**
 * /users end-point
 * method: get
 * get user by username
 * @param {express.request} req
 * @param {express.response} res
 */
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


// ------  ADD a new user
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
/**
 * /users end-point
 * method: post
 * register user profile
 * expects Username, Password, Email, Birthday
 * @param {express.request} req
 * @param {express.response} res
 */
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

    // hashes any password enteres by the iser when registering before storing it in the MongoDB database
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

// -------  allows user to update their details
/**
 * /users/ end-point
 * method: put
 * update user's profile
 * @param {express.request} req
 * @param {express.response} res
 */
app.put('/users/:Username',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate({ Username: req.params.Username },
      {
        $set:
        {
          Username: req.body.Username,
          Password: hashedPassword,
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

// -------- add a movie to user's list of favourites
/**
 * /users end-point
 * method: post
 * add movie to user's favorites
 * @param {express.request} req
 * @param {express.response} res
 */
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
        }
      });
  });


// -------  remove a movie from the user's list of favourites
/**
 * /users end-point
 * method: delete
 * delete a movie from user's favorites
 * @param {express.request} req
 * @param {express.response} res
 */
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

// ------- DELETE current USER by removing data
/**
 * /users end-point
 * method: delete
 * delete user's profile
 * @param {express.request} req
 * @param {express.response} res
 */
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

// Error-handling middleware function that will log all application-level errors to the terminal
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Server listens to Port 8080. For HTTP Port 80 is the default Port
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('This app is listening on port ' + port);
});
