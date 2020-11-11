var express  = require('express');
var app      = express();
var port     = process.env.PORT || 3000;
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var passport = require('passport');
var User = require('./models/user');
var Admin = require('./models/admin');
var Order = require('./models/order');

//Express Session
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));

// Bodyparser middleware
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cookieParser());
app.set("view engine", "jade");


// Passport init
app.use(passport.initialize());
app.use(passport.session());

//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

// Connect to MongoDB
mongoose.connect(
    "mongodb+srv://Admin:root@mean-user-s7vzb.mongodb.net/test?retryWrites=true&w=majority",{useUnifiedTopology:true}
    //"mongodb://localhost:27017/loginapp",{useUnifiedTopology: true }
    )
    .then(() => console.log("MongoDB successfully connected"))
    .catch(err => console.log(err));;
mongoose.set('debug', true);
var db = mongoose.connection;

//Order post request
var prod;
var userna;
var quantity;
var address;
var mobile;
var date;
app.post('/apply', function(req, res){
  prod=req.body.product;
  quantity=req.body.weight;
  res.sendFile(__dirname+"/perdata.html");
});
app.post('/perdata',function(req,res){
  mobile=req.body.mobile;
  address=req.body.address +" , "+ req.body.city +" , "+ req.body.state;
  let date_ob = new Date();
  let dat = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  date=year + "-" + month + "-" + dat;
  var newOrder=new Order({
    product:prod,
    userid:req.user.id,
    username:userna,
    quantity:quantity,
    address:address,
    mobile:mobile,
    orderDate:date
  });
  Order.createOrder(newOrder, function(err, user){
    if(err) throw err;
    //res.send(user).end()
  });
  //alert('Order Placed Successfully !!');
  res.sendFile(__dirname+"/dummy.html");
});

// Register User
app.post('/register', function(req, res){
  var password = req.body.password;
  var password2 = req.body.password2;

  if (password == password2){
    var newUser = new User({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password
    });

    User.createUser(newUser, function(err, user){
      if(err) throw err;
      res.send(user).end()
    });
  } else{
    res.status(500).send("{errors: \"Passwords don't match\"}").end()
  }
});


var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Unknown User'});
      }
      User.comparePassword(password, user.password, function(err, isMatch){
        if(err) throw err;
     	if(isMatch){
     	  return done(null, user);
     	} else {
     	  return done(null, false, {message: 'Invalid password'});
     	}
     });
   });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

function isLoggedIn(request, response, next) {
  // passport adds this to the request object
  if (request.isAuthenticated()) {
      return next();
  }
  response.redirect('/login');
}

function isLogged(request, response, next) {
  // passport adds this to the request object
  if (request.isAuthenticated()) {
      return next();
  }
  response.redirect('/login');
}

// Endpoint to login
app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

// Endpoint to get current user
app.get('/user', function(req, res){
  res.send(req.user);
})


// Endpoint to logout
app.get('/logout', function(req, res){
  req.logout();
  res.sendFile(__dirname+"/index.html");
});

//get usertable rendered from mongo
app.get("/usertable", async (req, res) => {
  User.find(function(err,result){
    console.log(result);
    res.render('index.ejs', { title: 'Express' , records: result });
  });
});

//get ordertable rendered from mongo
app.get("/ordertable", async (req, res) => {
  Order.find(function(err,result){
    console.log(result);
    res.render('order.ejs', { title: 'Express' , records: result });
  });
});

//Router
app.get("/",function(req,res){
    res.sendFile(__dirname+"/index.html");
});

app.get('/safe', isLoggedIn, (request, response) => {
  response.sendFile(__dirname+"/safe.html");
});

app.get('/safe', isLoggedIn, (request, response) => {
  response.sendFile(__dirname+"/safe.html");
});

app.get("/login",function(req,res){
    res.sendFile(__dirname+"/login.html");
});

app.get("/loginB",isLoggedIn,function(req,res){
    // res.alert("Already Logged In !!");

    res.sendFile(__dirname+"/index.html");
});

app.get("/signup",function(req,res){
    res.sendFile(__dirname+"/signup.html");
});

app.get("/usertable",function(req,res){
  res.sendFile(__dirname+"/dummy.html");
});

app.get("/dashboard",function(req,res){
  res.sendFile(__dirname+"/dashboard/index.html");
});

app.get("/apply", isLoggedIn,function(req,res){
  res.sendFile(__dirname+"/apply.html");
});

app.get("/perdata",function(req,res){
  res.sendFile(__dirname+"/perdata.html");
});

//Listen on PORT 3000
app.listen(3000,function(){
    console.log("Server started on port 3000!!")
});
