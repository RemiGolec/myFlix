const express = require('express'),
      morgan = require('morgan'),
      mongoose = require('mongoose'),
      Models = require('./models.js'),
      bodyParser = require('body-parser');

const app = express(),
      Movies = Models.Movie,
      Users = Models.User;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/myFlixDB', {useNewUrlParser: true, useUnifiedTopology: true });

let topMovies = [
  {
    genre: 'art',
    title: 'MOVABLE TYPE',
    director: 'Pam'
    
  },
  {
    title: 'ROCKWELL',
    director: 'Tom',
    genre: 'thriller'
  },
  {
    title: 'OUT THERE',
    director: 'Goryl',
    genre: 'sf'
  },
  {
    title: 'THE FUNDAMENTALS OF CREATIVE DESIGN',
    director: 'Pam',
    genre: 'comedy'
  },
  {
    title: 'IDIOMS',
    director: 'Goryl',
    genre: 'sf'
  },
  {
    title: 'STEALING SHEEP',
    director: 'Pam',
    genre: 'comedy'
  },
  {
    title: 'PHOSFATE INLINE',
    director: 'Goryl',
    genre: 'sf'
  },
];

// return a LIST of ALL MOVIES
app.get('/movies', (req, res) => {
    res.json(topMovies);
});

//return a SINGLE MOVIE by title
app.get('/movies/:movieTitle', (req, res) => {
  res.json(topMovies.find((movie) => {
    return movie.title === req.params.movieTitle }));
});

//return all movies in selected GENRE
app.get('/movies/genre/:movieGenre', (req, res) => {
  res.json(topMovies.filter((movie) => {
    return movie.genre === req.params.movieGenre;
  }));
});

//return selected by name DIRECTOR's BIO 
app.get('/directors/:name', (req, res) => {
  res.send('Succesful Director\'s Bio Selection' );
});

//read data about all users
app.get('/users', (req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
  })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
  });
});

//read data of a user by username
app.get('/users/:Username', (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//allow new user to register
app.post('/users', (req, res) => {

  Users.findOne({ Username: req.body.Username }).then((user) => {
    if (user) {
      return res.status(400).send(req.body.Username + ' already exists ');
    } else {
      Users.create({
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      })
      .then((user) => {res.status(201).json(user) })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
    }
  })
})

//allow user to update their details
app.put('/users/:name', (req, res) => {
  res.send('Successful PUT returns message "User details updated to: updated data" ');
});

//allow user to add movie to their list of favourites
app.put('/favourites/add/:title', (req, res) => {
  res.send('Successful PUT adds title to favourites list and message about the title being added to the list');
})

//allow user to remove a movie from list of favourites
app.delete('/favourites/remove/:title', (req, res) => {
  res.send('Succesfull DELETE removes title from favourites and shows message about title removed');
});

//allow existing user to deregister
app.delete('/users/delete/:name', (req, res) => {
  res.send('Succesful DELETE removes user from register and shows message confirming deregistration');
});



app.get('/', (req, res) => {
    res.send('Welcome to my app!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
    console.log('This app is listening on port 8080');
});
