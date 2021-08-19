const express = require('express'),
      morgan = require('morgan');

const app = express();

app.use(morgan('common'));
app.use(express.static('public'));


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


//allow new user to register
app.post('/users', (req, res) => {
  res.send('Successful POST returns message "New User added with ID number assigned"'); 
});

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
