const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const MongoClient = require("mongodb").MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0hcik.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`;
const port = process.env.PORT || 5000

const app = express();

app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./configs/burj-al-arab-19c6c-firebase-adminsdk-y7ty3-3f06e46152.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://burj-al-arab.firebaseio.com"
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("borjAlArab").collection("bookings");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/bookings", (req, res) => {
      const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
        const idToken = bearer.split(' ')[1];
        admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          console.log(tokenEmail, req.query.email);
          if(tokenEmail == req.query.email){
            bookings.find({email: req.query.email})
            .toArray((err, documents) => {
                res.status(200).send(documents)
            })
          } 
          else{
            res.status(401).send('un-authorize access')
          }
        })
        .catch((error) => {
            res.status(401).send('un-authorize access')
        });
    }
    else{
        res.status(401).send('un-authorize access')
    }
  });

  app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
});
app.listen(port);


