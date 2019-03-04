var express = require('express'),
  app = express(),
  mongoose = require('mongoose'),
  bodyParser = require('body-parser'),
  passport = require('passport'),
  LocalStrategy = require('passport-local'),
  passportLocalMongoose = require('passport-local-mongoose'),
  router = express.Router({ mergeParams: true });
const keys = require('./config/keys');

// ----------
// APP CONFIG
// ----------

mongoose.connect(keys.mongoURI);

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));

// ----------
// MONGOOSE BLOG CONFIG
// ----------

var blogSchema = new mongoose.Schema({
  title: String,
  caption: String,
  hero_image: String,
  body: String,
  created: { type: Date, default: Date.now }
});
var Blog = mongoose.model('Blog', blogSchema);

// Security schema
var securitySchema = new mongoose.Schema({ key: Number });
var Security = mongoose.model('Security', securitySchema);

// ----------
// MONGOOSE contact CONFIG
// ----------

var contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  number: String
});
var Contact = mongoose.model('Contact', contactSchema);

// ----------
// MONGOOSE REVIEW CONFIG
// ----------

var reviewSchema = new mongoose.Schema({
  author: String,
  title: String,
  image: String,
  body: String,
  created: { type: Date, default: Date.now }
});
var Review = mongoose.model('Review', reviewSchema);

// ----------
// MONGOOSE Shop CONFIG
// ----------

var shopSchema = new mongoose.Schema({
  title: String,
  // body: String,
  // price: Number,
  image: String
});
var Shop = mongoose.model('Shop', shopSchema);

Shop.create({ title: 'Basic Hoverboard', image: '/images/shop/basic.jpg' });

// ----------
// MONGOOSE USER CONFIG
// ----------

var UserSchema = new mongoose.Schema({ username: String, password: String });

UserSchema.plugin(passportLocalMongoose);

User = mongoose.model('User', UserSchema);

// ----------
// MONGOOSE Slide CONFIG
// ----------

var SlideSchema = new mongoose.Schema({ image: String });

Slide = mongoose.model('Slide', SlideSchema);

// ----------
// PASSPORT CONFIG
// ----------

app.use(
  require('express-session')({
    secret: keys.secret,
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

// test

// ----------
// ROUTES
// ----------

// LANDING PAGE

app.get('/', function(req, res) {
  Slide.find({}, function(err, foundSlide) {
    if (err) console.log('Error at /');
    else {
      res.render('landing', { slides: foundSlide });
    }
  });
});

// contact us submit
app.post('/contact', function(req, res) {
  console.log(req.body);
  Contact.create(
    { name: req.body.name, number: req.body.number, email: req.body.email },
    function(err, newContact) {
      if (err) {
        console.log('Error'), res.redirect('/');
      } else {
        res.redirect('/');
      }
    }
  );
});

// TEST ROUTE
app.get('/test', function(req, res) {
  Security.findOne({}, (err, found) => console.log(found.key));
  res.send('Test Route');
});

// SHOP ROUTE

app.get('/shop', function(req, res) {
  Shop.find({}, function(err, shops) {
    if (err) {
      console.log('Error at /shops');
    } else {
      res.render('shop', { shops: shops });
    }
  });
});

// SHOW BLOGS

app.get('/blogs', function(req, res) {
  Blog.find({}, function(err, blogs) {
    if (err) {
      console.log('Error at /blogs');
    } else {
      res.render('blogs', { blogs: blogs });
    }
  });
});

// SHOW SPECIFIC BLOG

app.get('/blogs/:id', function(req, res) {
  Blog.findById(req.params.id, function(err, foundBlog) {
    if (err) {
      console.log('error at blogs/:id');
    } else {
      res.render('show', { blog: foundBlog });
    }
  });
});

// REVIEWS  PAGE

app.get('/review', function(req, res) {
  Review.find({}, function(err, foundReview) {
    if (err) console.log('Error at /review');
    else {
      res.render('review', { reviews: foundReview });
    }
  });
});
// LOGIN FORM

app.get('/admin', function(req, res) {
  res.render('login');
});

// LOGIN LOGIC

app.post(
  '/admin',
  passport.authenticate('local', {
    successRedirect: '/',
    faliureRedirect: '/admin'
  }),
  function(req, res) {}
);

// REGISTER FORM

app.get('/register', function(req, res) {
  Security.findOne({}, (err, found) => {
    if (found.key == 1) {
      res.render('register');
    } else {
      res.send('Unauthorized');
    }
  });
});

// REGISTER LOGIC

app.post('/register', function(req, res) {
  Security.findOne({}, (err, found) => {
    if (found.key == 1) {
      var newUser = new User({ username: req.body.username });
      User.register(newUser, req.body.password, function(err, user) {
        if (err) {
          console.log(err);
          return res.render('register');
        }
        passport.authenticate('login')(req, res, function() {
          console.log('Registered Succesfully');
          res.redirect('/blogs');
        });
      });
    } else {
      res.send('Unauthorized');
    }
  });
});

// LOGOUT LOGIC

app.get('/logout', function(req, res) {
  req.logout();
  console.log('Logged out Succesfully');
  res.redirect('/blogs');
});

app.use(isLoggedIn);

// get contact info

app.get('/admin/contact', (req, res) => {
  Contact.find({}, (err, contacts) => {
    if (err) {
      console.log('error accessing contacts');
    } else {
      res.send(contacts);
    }
  });
});

// ADD NEW BLOG FORM

app.get('/admin/blogs/new', function(req, res) {
  res.render('newBlog');
});

// ADDING NEW BLOG

app.post('/admin/blogs', function(req, res) {
  Blog.create(
    {
      title: req.body.title,
      caption: req.body.caption,
      hero_image: req.body.image,
      body: req.body.body
    },
    function(err, newBlog) {
      if (err) {
        console.log('Error'), res.redirect('/admin/blogs/new');
      } else {
        res.redirect('/blogs/' + newBlog._id);
      }
    }
  );
});

// ADD NEW REVIEW FORM

app.get('/admin/review/new', function(req, res) {
  res.render('newReview');
});
// ADDING NEW REVIEW

app.post('/admin/review', function(req, res) {
  Review.create(
    {
      author: req.body.author,
      title: req.body.title,
      image: req.body.image,
      body: req.body.body
    },
    function(err, newBlog) {
      if (err) {
        console.log('Error'), res.redirect('/admin/review/new');
      } else {
        res.redirect('/review');
      }
    }
  );
});

// EDIT BLOG FORM

app.get('/admin/blogs/:id/edit', function(req, res) {
  Blog.findById(req.params.id, function(err, foundBlog) {
    if (err) {
      console.log('Error');
      res.redirect('/blogs/' + req.params.id);
    } else {
      res.render('edit', { blog: foundBlog });
    }
  });
});

// EDIT BLOG ACTION
// CHANGE POST TO PUT!!!!!!! REST!!

app.post('/admin/blogs/:id/edit', function(req, res) {
  Blog.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      caption: req.body.title,
      hero_image: req.body.image,
      body: req.body.body
    },
    function(err, foundBlog) {
      if (err) {
        console.log('error');
      } else {
        res.redirect('/blogs/' + req.params.id);
      }
    }
  );
});

// DELETE ROUTE
// CHANGE POST TO DELETE!! REST !!

app.get('/admin/blogs/:id/delete', function(req, res) {
  Blog.findByIdAndRemove(req.params.id, function(err) {
    if (err) {
      console.log('Error');
    } else {
      res.redirect('/blogs');
    }
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/admin');
}

// ----------
// SERVER INITIALIZATION
// ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT);
