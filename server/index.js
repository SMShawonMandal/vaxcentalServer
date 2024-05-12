const express = require('express')
const app = express()
const port = 5001
const cors = require('cors');
app.use(cors());
app.use(express.json());
const jwt = require('jsonwebtoken');


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

    // const EmployeeCollection = client.db('VaxCentral').collection('employee_credentials');

    const childrenCollection = client.db('VaxCentral').collection('Childrens');

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
        const { fullName, nidNumber, mobileNumber, dob, password,designation } = req.body;

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
          password,
          designation
        });

        console.log(userId, fullName, nidNumber, mobileNumber, dob, password,designation);
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

        const alreadyRegisteredvaccine = await ongoingVaccination.findOne({ $and: [ { disease_name: disease_name }, { nid: nid } ] });

        // const alreadyRegisterednid = await alreadyRegisteredvaccine.findOne({ nid: nid });
        // console.log(alreadyRegistered);

        if (alreadyRegisteredvaccine) {
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
        const { mobileNumber, password } = req.body;

        const userData = await UserCollection.findOne({ mobileNumber : mobileNumber , password : password });

        console.log(userData);

        if (!userData) {
          res.status(400).json({ message: 'Invalid mobile number or password' });
          return;
        }

        const token = jwt.sign(
          { id: userData._id },
          'loki124578',
          { expiresIn: '1h' }
        );

        res.json({ token, message: 'You are now logged in!', userData });
      } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'An error occurred' });
      }
    });

    // post request for employee login

    // app.post('/api/Login/emoployee', async (req, res) => {
    //   try {
    //     // Extract form data from request body
    //     const {employee_id , password} = req.body;
    //     const existingEmployee = await EmployeeCollection.findOne({ employee_id, password });
    //     if (existingEmployee.employee_id === employee_id && existingEmployee.password === password) {
    //       res.status(201).send({ token: "1a2b3c4d5e6f7081920a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e", existingEmployee: existingEmployee });
    //     }

    //   } catch (error) {
    //     console.error('Error:', error); 
    //     res.status(500).send('Internal server error');
    //   }
    // });

    // get registered vaccine api 

    app.get('/api/ongoing', async (req, res) => {


      try {
        const registeredvaccine = await ongoingVaccination.find({ status: 'ongoing' }).toArray()
        res.status(201).send({ data: registeredvaccine });

      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });


    // get completed vaccine api

    app.get('/api/completed', async (req, res) => {
      try {

        const completedvaccine = await ongoingVaccination.find({ status: 'completed' }).toArray()
        res.status(201).send({ data: completedvaccine });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // post request for children add

    app.post('/api/childrens', async (req, res) => {
      try {
        const childinfo = req.body;
        const response = await childrenCollection.insertOne(childinfo)
        res.status(201).send({ data: response });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    })


    // get request for childrens
    app.get('/api/childrens', async (req, res) => {

      try {
        const response = await childrenCollection.find().toArray();
        res.status(201).send({ data: response });

      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    })

  // Send a ping to confirm a successful connection
  await client.db("admin").command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
} finally {

}
}
run().catch(console.dir);


app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))