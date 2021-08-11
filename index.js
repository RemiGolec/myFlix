const express = require('express'),
      morgan = require('morgan');

const app = express();

app.use(morgan('common'));
app.use(express.static('public'));


let topMovies = [
  {
    title: 'MOVABLE TYPE',
    author: 'Pam'
  },
  {
    title: 'ROCKWELL',
    author: 'Tom'
  },
  {
    title: 'OUT THERE',
    author: 'Goryl'
  }
];


app.get('/movies', (req, res) => {
    res.json(topMovies);
});

app.get('/', (req, res) => {
    res.send('Welcome to my app!');
});


app.listen(8080, () => {
    console.log('This app is listening on port 8080');
});
