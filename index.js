import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import fetch from "node-fetch";

const app = express();
const port= 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "catalog",
  password: "@779classblip",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

const books =[];






// Home route to display all books
app.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM books');
    const books = result.rows;
    res.render('home', { books });
  } catch (error) {
    console.error('Error loading books:', error);
    res.status(500).send('Error loading books from database');
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.get('/books/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);

  try {
    // Fetch the book details from your database
    const result = await db.query('SELECT * FROM books WHERE id = $1', [id]);
    const book = result.rows[0];

    if (book) {
      // Render a view with the book details
      res.render('book_details', { book });
    } else {
      res.status(404).send('Book not found');
    }
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).send('Error fetching book');
  }
});


// Search for a book
app.get('/search', async (req, res) => {
  const query = req.query.q;
  try {
    const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (data.docs.length === 0) {
      return res.send("no book can be found with this title");
    }

    const book = data.docs[0];
    console.log(book);
    const coverUrl = book.olid
      ? `https://covers.openlibrary.org/b/olid/${book.coverUrl}-M.jpg`
      : '/images/default-cover.jpg';

    res.render('search-result', {
      book: {
        olid: book.cover_edition_key || '',
        coverUrl: coverUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).send('Error searching for book');
  }
});

// Add book to the database
app.post('/add-book', async (req, res) => {
  const { olid, description, rating } = req.body;

  try {
    await db.query(
      'INSERT INTO books (olid, description, rating) VALUES ($1, $2, $3)',
      [olid, description, rating]
    );
    res.redirect('/');
  } catch (error) {
    console.error('Error adding book to database:', error);
    res.status(500).send('Error adding book to database');
  }
});

app.get('/books/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);

  try {
      const result = await db.query('SELECT * FROM books WHERE id = $1', [id]);

      if (result.rows.length === 0) {
          return res.status(404).send('Book not found');
      }

      const book = result.rows[0];
      res.render('edit_book.ejs', { book }); // Render the edit form
  } catch (error) {
      console.error('Error fetching book:', error);
      res.status(500).send('Internal Server Error');
  }
});
app.get('/books/:id/edit', async (req, res) => {
  const bookId = parseInt(req.params.id, 10);

  try {
      const result = await db.query('SELECT * FROM books WHERE id = $1', [bookId]);

      if (result.rows.length === 0) {
          return res.status(404).send('Book not found');
      }

      const book = result.rows[0];
      res.render('edit_book.ejs', { book }); // Render the 'edit-book.ejs' view
  } catch (error) {
      console.error('Error fetching book:', error.message);
      res.status(500).send('Internal Server Error');
  }
});


app.post('/books/:id', async (req, res) => {
  const bookId = parseInt(req.params.id, 10); // Ensure ID is a number
  const { description, rating } = req.body;

  try {
      const result = await db.query(
          'UPDATE books SET description = $1, rating = $2 WHERE id = $3 RETURNING *',
          [description, rating, bookId]
      );

      if (result.rows.length === 0) {
          return res.status(404).send('Book not found');
      }

      res.redirect(`/books/${bookId}`); // Redirect to the book details page
  } catch (error) {
      console.error('Error updating book:', error.message);
      res.status(500).send('Internal Server Error');
  }
});


app.get('/books/:id/delete', async (req, res) =>{
  const id = req.params.id;
  console.log(id);

  try {
    const result = await db.query('delete FROM books WHERE id = $1', [id]);

    res.redirect('/');
    

    // Render the edit form
} catch (error) {
    console.error('book not deleted', error);
    res.status(500).send('Internal Server Error');
}
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

