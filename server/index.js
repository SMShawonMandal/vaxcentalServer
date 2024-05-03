const express = require('express')
const app = express()
const port = 5001
const cors = require('cors');
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://VaxCentral:EhpHxrdmEhfMMB6h@cluster0.f3s7axw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const UserCollection = client.db('VaxCentral').collection('user_credentials');

    // creating vaccine collection
    const vaccines = client.db('VaxCentral').collection('vaccines');


    // creating ongoing vaccine collection
    const ongoingVaccination = client.db('VaxCentral').collection('Ongoing');

    // read vaccine api
    app.get('/api/vaccines', async (req, res) => {
      try {

        const result = await vaccines.find().toArray();
        // console.log('Users:', result);

        res.status(201).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // create user api
    app.post('/api/signup', async (req, res) => {
      try {
        // Extract form data from request body
        const { fullName, nidNumber, mobileNumber, dob, password } = req.body;

        // Updated here
        const latestUser = await UserCollection.countDocuments() // This line helps to count total data from a database

        // after then total data + 1
        const userId = latestUser + 1

        const result = await UserCollection.insertOne({
          userId, // Insert incremented userId
          fullName,
          nidNumber,
          mobileNumber,
          dob,
          password
        });

        console.log(userId, fullName, nidNumber, mobileNumber, dob, password);
        // console.log('User inserted:', result);

        res.status(201).send('User registered successfully');
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    //post register vaccine api 
    app.post('/api/ongoing', async (req, res) => {
      try {
        // Extract form data from request body
        const { name, phonenumber, nid, disease_name, total_doses, completed_doses, status } = req.body;

        // exception handling if the user already registered a vaccine and then try to register again

        const alreadyRegistered = await ongoingVaccination.findOne({ disease_name: disease_name });

        // console.log(alreadyRegistered);

        if (alreadyRegistered) {
          return res.status(400).send({ status: 400, message: "User already registered" });
        }

        else {
          const result = await ongoingVaccination.insertOne({
            name,
            phonenumber,
            nid,
            disease_name,
            total_doses,
            completed_doses,
            status
          });
          res.status(200).send({ status: 200, data: result });
        }



      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });


    app.get('/api/signup', async (req, res) => {
      try {

        const result = await UserCollection.find().toArray();
        // console.log('Users:', result);

        res.status(201).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });


    app.post('/api/login', async (req, res) => {
      try {
        // Extract form data from request body
        const { mobileNumber, password } = req.body;
        console.log(mobileNumber, password)
        const existingUser = await UserCollection.findOne({ mobileNumber, password });

        if (existingUser.mobileNumber === mobileNumber && existingUser.password === password) {
          res.status(201).send({ token: "0c0c0df58408b9827a245e7d215687e18d42869de66eb687550491daad648251eb5fb763273e252519495f30e6268c6c", existingUser: existingUser });
        }

      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });


    // get registered vaccine api 

    app.get('/api/ongoing', async (req, res) => {


      try {
        const registeredvaccine = await ongoingVaccination.find({status:'ongoing'}).toArray()
        res.status(201).send({ data: registeredvaccine });

      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });


    // get completed vaccine api

    app.get('/api/completed', async (req, res) => {
      try {

        const completedvaccine = await ongoingVaccination.find({status:'completed'}).toArray()
        res.status(201).send({ data: completedvaccine });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))