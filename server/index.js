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

    // const userSearch = client.db('User').collection('user_credentials');
    // const EmployeeCollection = client.db('VaxCentral').collection('employee_credentials');

    const childrenCollection = client.db('VaxCentral').collection('Childrens');

    // creating vaccine collection
    const vaccines = client.db('VaxCentral').collection('vaccines');


    // creating ongoing vaccine collection
    const ongoingVaccination = client.db('VaxCentral').collection('Ongoing');

    // creating ongoing vaccine collection for children
    const childrenOngoing = client.db('VaxCentral').collection('childVaccine');

    // dose traker collection
    const doseTraker = client.db('VaxCentral').collection('doseTraker');

     // ------------------------------------------------------------------------------------------
    // Dose traking api
    // ---------------------------------------------------------------------------------------------
    app.post('/api/dose/doseTraker'  , async (req, res) => {
      try {
        console.log('hitted')
        const {name, disease_name,parentNid} = req.body;
        const result = await doseTraker.findOne({name: name, parentNid: parentNid, disease_name:disease_name});
        res.status(201).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }

    })

    app.patch('/api/dose/doseTraker'  , async (req, res) => {
      try {
        console.log('hitted')
        const {name, disease_name,parentNid} = req.body;
        const result = await doseTraker.updateOne({name: name, parentNid: parentNid, disease_name:disease_name}, {btnStatus: false});
        res.status(201).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }

    })
    app.post('/api/doseTraker'  , async (req, res) => {
      try {
        const {name, completed_doses, nextDate, disease_name,parentNid} = req.body;
        const btnStatus = true
        const result = await doseTraker.insertOne({name, completed_doses, disease_name,parentNid,enableDate:nextDate, btnStatus});
        res.status(201).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }

    })


    // ------------------------------------------------------------------------------------------
    // vaccine api
    // ---------------------------------------------------------------------------------------------
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
    app.get('/api/vaccines/:name', async (req, res) => {
      const { name } = req.params
      try {

        const result = await vaccines.findOne({ disease_name: name });
        // console.log('Users:', result);

        res.status(201).send({ ...result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });
    


     // ------------------------------------------------------------------------------------------
    // User Api
    // ---------------------------------------------------------------------------------------------
    // create user api
    app.post('/api/signup', async (req, res) => {
      try {
        // Extract form data from request body
        const { fullName, nidNumber, mobileNumber, dob, password, designation } = req.body;

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

        console.log(userId, fullName, nidNumber, mobileNumber, dob, password, designation);
        // console.log('User inserted:', result);

        res.status(201).send('User registered successfully');
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

        const userData = await UserCollection.findOne({ mobileNumber: mobileNumber, password: password });

        // console.log(userData);

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


    // ------------------------------------------------------------------------------------------
    // User's child ongoing api
    // --------------------------------------------------------------------------------------------
    //update vaccine status for children ongoing api 
    app.patch('/api/childOngoing', async (req, res) => {
      try {
        console.log("hitted");
        // Extract form data from request body
        const { name, completed_doses, nextDate, disease_name, parentNid } = req.body;
        console.log(name, completed_doses, nextDate, disease_name, parentNid);
    
        // Fetch the existing ongoing vaccination record
        const existing = await childrenOngoing.findOne({ disease_name: disease_name, parentNid: parentNid, name: name });
        console.log("existing", existing);
    
        // Check if completed doses are less than total doses

        if(existing.completed_doses+1 === existing.total_doses){
          const filter = { disease_name: disease_name, parentNid: parentNid, name: name };
          const update = {
            $set: {
              status: 'completed',
              completion_date : existing.next_dose_date,
            }
          };
          const result = await childrenOngoing.updateOne(filter, update);
          console.log("Update successful", result);
          return res.status(200).send({ status: 200, data: result });
        }
        else if( existing.completed_doses+1 < existing.total_doses) {
          const filter = { disease_name: disease_name, parentNid: parentNid, name: name };
          const update = {
            $set: {
              completed_doses: existing.completed_doses + 1,
              next_dose_date: nextDate
            }
          };
          const result = await childrenOngoing.updateOne(filter, update);
          console.log("Update successful", result);
          return res.status(200).send({ status: 200, data: result });
        }


        // if (existing.completed_doses < existing.total_doses && existing.completed_doses !== existing.total_doses) {
        //   // Increment completed doses and update next dose date
        //   const filter = { disease_name: disease_name, parentNid: parentNid, name: name };
        //   const update = {
        //     $set: {
        //       completed_doses: existing.completed_doses + 1,
        //       next_dose_date: nextDate
        //     }
        //   };
        //   const result = await childrenOngoing.updateOne(filter, update);
        //   console.log("Update successful", result);
        //   return res.status(200).send({ status: 200, data: result });
        // } else {
        //   // If all doses are completed, mark status as completed
        //   const filter = { disease_name: disease_name, parentNid: parentNid, name: name };
        //   const update = {
        //     $set: {
        //       status: 'completed'
        //     }
        //   };
        //   const result = await childrenOngoing.updateOne(filter, update);
        //   console.log("Vaccination completed", result);
        //   return res.status(200).send({ status: 200, data: result });
        // }
      } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal server error');
      }
    });
    
    // ongoing vacchine api for children
    app.post('/api/child/childOngoing', async (req, res) => {

      const { nid, name } = req.body
      try {
        const ongoing = await childrenOngoing.find({ status: 'ongoing', parentNid: nid, name: name }).toArray()
        console.log(ongoing)
        res.status(201).send({ data: ongoing });

      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    app.post('/api/allChildsOngoing', async (req, res) => {

      const { nid } = req.body
      try {
        const ongoing = await childrenOngoing.find({ status: 'ongoing', parentNid: nid }).toArray()
        console.log(ongoing)
        res.status(201).send({ data: ongoing });

      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });
    
    // registerd child vacchine api
    app.post('/api/childOngoing', async (req, res) => {
      try {
        // Extract form data from request body
        const { name, parentNid, disease_name, total_doses, completed_doses, status } = req.body;

        // exception handling if the user already registered a vaccine and then try to register again

        const alreadyRegisteredvaccine = await childrenOngoing.findOne({ disease_name: disease_name, parentNid: parentNid, name: name });

        // const alreadyRegisterednid = await alreadyRegisteredvaccine.findOne({ nid: nid });
        // console.log(alreadyRegistered);

        if (alreadyRegisteredvaccine) {
          return res.status(400).send({ status: 400, message: "User already registered" });
        }

        else {
          const result = await childrenOngoing.insertOne({
            name,
            parentNid,
            disease_name,
            total_doses,
            completed_doses,
            status,
            next_dose_date: ""
          });
          res.status(200).send({ status: 200, data: result });
        }



      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    
    // child completed vaccine api
    app.get('/api/childCompleted/:nid/:name', async (req, res) => {
      const {nid,name} = req.params
      try {
        const completedChildVaccine = await childrenOngoing.find({ status: 'completed', parentNid: nid, name: name }).toArray()
        res.status(201).send({ data: completedChildVaccine });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // post request for employee login

    // get registered vaccine api 

    // user ongoing api
    app.get('/api/ongoing/:nid', async (req, res) => {

      const { nid } = req.params
      try {
        const registeredvaccine = await ongoingVaccination.find({ status: 'ongoing', nid: nid }).toArray()
        res.status(201).send({ data: registeredvaccine });

      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

  
    // ongoing vacchine api for children
    // app.get('/api/childOngoing/:nid/:childName', async (req, res) => {

    //   const { nid, childName } = req.params
    //   try {
    //     const ongoing = await childrenOngoing.find({ status: 'ongoing', parentNid: nid, name: childName }).toArray()
    //     res.status(201).send({ data: ongoing });

    //   } catch (error) {
    //     console.error('Error:', error);
    //     res.status(500).send('Internal server error');
    //   }
    // });


    // get completed vaccine api
    app.get('/api/completed/:nid', async (req, res) => {
      const nid = req.params.nid
      try {

        const completedvaccine = await ongoingVaccination.find({ status: 'completed', nid: nid }).toArray()
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

    // ------------------------------------------------------------------------------------------
    // Employee api
    // --------------------------------------------------------------------------------------------

    app.get('/api/user/search', async (req, res) => {
      const { userId } = req.body;
      console.log(userId);
      const filter = { designation: 'user', userId: parseInt(userId) }
      const result = await UserCollection.findOne(filter)
      console.log(filter)
      res.status(200).json({ data: result });
    });

    app.post('/api/user/search', async (req, res) => {

      const { userId } = req.body;
      console.log(userId);
      const filter = { designation: 'user', userId: parseInt(userId) }
      const result = await UserCollection.findOne(filter)
      // console.log(filter, result)
      res.status(200).json({ data: result });
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