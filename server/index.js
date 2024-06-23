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

    const contactCollection = client.db('VaxCentral').collection('contactForm');

    // const userSearch = client.db('User').collection('user_credentials');
    // const EmployeeCollection = client.db('VaxCentral').collection('employee_credentials');

    const childrenCollection = client.db('VaxCentral').collection('Childrens');

    // creating vaccine collection
    const vaccines = client.db('VaxCentral').collection('vaccines');


    // creating ongoing vaccine collection
    const ongoingVaccination = client.db('VaxCentral').collection('Ongoing');

    // creating ongoing vaccine collection for children
    const childrenOngoing = client.db('VaxCentral').collection('childVaccine');

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
      console.log(name)
      try {

        const result = await vaccines.findOne({ vaccine_name: name });
        console.log('Ongoin Vaccines:', result);

        res.status(201).send({ ...result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // Admin Api

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
        const { name, nextDate, nid, vaccine_name, total_doses } = req.body;

        const existing = await childrenOngoing.findOne({ vaccine_name: vaccine_name, parentNid: nid, name: name });
        console.log("existing", existing);

        console.log(existing.completed_doses, total_doses, existing.completed_doses + 1 <= existing.total_doses)

        if (existing.completed_doses + 1 < existing.total_doses) {
          const filter = { vaccine_name: vaccine_name, parentNid: nid, name: name };
          const update = {
            $inc: { "completed_doses": 1 },
            $set: { "next_dose_date": nextDate }
          };
          console.log("Updated", update)
          const result = await childrenOngoing.updateOne
            (filter, update);
          console.log("Update successful", result);
          return res.status(200).send({ status: 200, data: result });
        }
        else if (existing.completed_doses + 1 === existing.total_doses) {
          const filter = { vaccine_name: vaccine_name, parentNid: nid, name: name };
          const update = {
            $set: {
              status: 'completed',
              completion_date: existing.next_dose_date,
            }
          };
          const result = await childrenOngoing.updateOne
            (filter, update);
          console.log("Update successfully completed", result);
          return res.status(200).send({ status: 200, data: result });
        }
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
        const { name, parentNid, disease_name, vaccine_name, total_doses, completed_doses, status } = req.body;

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
            vaccine_name,
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
      const { nid, name } = req.params
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


    //post register vaccine api 
    app.post('/api/ongoing', async (req, res) => {
      try {
        // Extract form data from request body
        const { name, phonenumber, nid, disease_name, vaccine_name, total_doses, completed_doses, next_dose_date, status } = req.body;

        // exception handling if the user already registered a vaccine and then try to register again

        const alreadyRegisteredvaccine = await ongoingVaccination.findOne({ $and: [{ disease_name: disease_name }, { nid: nid }] });

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
            vaccine_name,
            disease_name,
            total_doses,
            completed_doses,
            next_dose_date,
            status
          });
          res.status(200).send({ status: 200, data: result });
        }



      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });




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

    // user vaccine register api

    app.patch('/api/user/ongoing/vaccines', async (req, res) => {
      try {
        const { name, nextDate, nid, completed_doses, disease_name, vaccine_name, total_doses } = req.body;

        const existing = await ongoingVaccination.findOne({ vaccine_name: vaccine_name, nid: nid, name: name });
        console.log(req.body)

        console.log(existing.completed_doses, total_doses, existing.completed_doses + 1 <= existing.total_doses)

        if (existing.completed_doses + 1 < existing.total_doses) {
          const filter = { vaccine_name: vaccine_name, nid: nid, name: name };
          const update = {
            $inc: { "completed_doses": 1 },
            $set: { "next_dose_date": nextDate }
          };
          console.log("Updated", update)
          const result = await ongoingVaccination.updateOne
            (filter, update);
          console.log("Update successful", result);
          return res.status(200).send({ status: 200, data: result });
        }
        else if (existing.completed_doses + 1 === existing.total_doses) {
          const filter = { vaccine_name: vaccine_name, nid: nid, name: name };
          const update = {
            $set: {
              status: 'completed',
              completion_date: existing.next_dose_date,
            }
          };
          const result = await ongoingVaccination.updateOne
            (filter, update);
          console.log("Update successfully completed", result);
          return res.status(200).send({ status: 200, data: result });
        }
      } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal server error');
      }
    });





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

    // Guest api  .......................................

    app.post('/api/contact', async (req, res) => {
      try {
        const { name, email, message, phoneNumber, subject } = req.body;
        const response = await contactCollection.insertOne({
          name, email, message, phoneNumber, subject
        }
        )
        res.status(201).send({ data: response });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    })



    app.post('/api/guest', async (req, res) => {
      try {
        const { guestDob } = req.body;
        console.log(guestDob);

        // Calculate age
        const birthDate = new Date(guestDob);
        const age = new Date().getFullYear() - birthDate.getFullYear();

        // Query the database
        const response = await vaccines.find({ minimum_age: { $lte: age }, maximum_age: { $gte: age } }).toArray();

        res.status(201).send({ data: response });
        console.log(response);
      }
      catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });


    // -------------------------------------------------------------------------------------------------------------- Admin 

    // --------------------------------------------------------------------------------------------------------------


    // read  user whoose designation is user
    app.get('/api/admin/users', async (req, res) => {
      try {
        console.log('hit here')
        const result = await UserCollection.find({ designation: 'user' }).toArray();
        res.status(201).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // search a user
    app.get('/api/admin/user/search/:nid', async (req, res) => {
      try {
        const { nid } = req.params;
        const filter = { nidNumber: nid, designation: 'user' };
        const result = await UserCollection.findOne(filter);
        res.status(200).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });
    // update user api
    app.patch('/api/admin/user/edit', async (req, res) => {
      try {
        const { nid, fullName, nidNumber, mobileNumber, dob, password, } = req.body;
        const filter = { nidNumber: nid, designation: 'user' };
        const update = { $set: { fullName: fullName, nidNumber: nidNumber, mobileNumber: mobileNumber, dob: dob, password: password } };
        console.log(update)
        const result = await UserCollection.updateOne(filter, update);

        res.status(200).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // delete a user
    app.delete('/api/admin/user/delete/:nid', async (req, res) => {
      try {
        const { nid } = req.params;
        const filter = { nidNumber: nid, designation: 'user' };
        // const find = await UserCollection.findOne(filter)
        // console.log(find)
        console.log(req.params)
        const result = await UserCollection.deleteOne(filter);
        console.log(result)
        res.status(200).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });


    // read all employee api
    app.get('/api/admin/employees', async (req, res) => {
      try {
        console.log('hit here employee')
        const result = await UserCollection.find({ designation: 'employee' }).toArray();
        res.status(201).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // add employee
    app.post('/api/admin/employee/add', async (req, res) => {
      try {
        const { fullName, nidNumber, mobileNumber, dob, password } = req.body;

        const latestUser = await UserCollection.countDocuments();

        const userId = latestUser + 1;

        // check if existing user exists using nid

        const existingUser = await UserCollection.findOne({ nidNumber: nidNumber });

        if (!existingUser) {

          const result = await UserCollection.insertOne({
            userId,
            fullName,
            nidNumber,
            mobileNumber,
            dob,
            password,
            designation: 'employee'
          });

          console.log(result);

          res.status(201).send('User registered successfully');

        }
        else {
          return res.status(400).send('User already exists');
        }


      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // search a eployee
    app.get('/api/admin/employee/search/:nid', async (req, res) => {
      try {
        const { nid } = req.params;
        const filter = { nidNumber: nid, designation: 'employee' };
        const result = await UserCollection.findOne(filter);
        res.status(200).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // edit employee
    app.patch('/api/admin/employee/edit', async (req, res) => {
      try {
        const { nid, fullName, nidNumber, mobileNumber, dob, password, } = req.body;
        const filter = { nidNumber: nid, designation: 'employee' };
        const update = { $set: { fullName: fullName, nidNumber: nidNumber, mobileNumber: mobileNumber, dob: dob, password: password } };
        console.log(update)
        const result = await UserCollection.updateOne(filter, update);

        res.status(200).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // delete a eployee
    app.delete('/api/admin/employee/delete/:nid', async (req, res) => {
      try {
        const { nid } = req.params;
        const filter = { nidNumber: nid, designation: 'employee' };
        console.log(req.params)
        const result = await UserCollection.deleteOne(filter);
        console.log(result)
        res.status(200).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // edit vaccine api
    app.patch('/api/admin/vaccine/edit', async (req, res) => {
      try {
        const {
          searchVaccineName,
          total_dose_number,
          maximum_age,
          minimum_age,
          first_gap,
          second_gap,
          third_gap,
          fourth_gap,
          fifth_gap } = req.body;

        const filter = { vaccine_name: searchVaccineName };

        console.log(total_dose_number, minimum_age, maximum_age, first_gap, second_gap, third_gap, fourth_gap, fifth_gap)

        if (first_gap !== undefined) {
          const update = { $set: { total_dose_number, minimum_age, maximum_age, first_gap } };
          const result = await vaccines.updateOne(filter, update);
          console.log(result)
          console.log(result)
        }
        if (first_gap !== undefined && second_gap !== undefined) {
          const update = { $set: { total_dose_number, minimum_age, maximum_age, first_gap, second_gap } };
          const result = await vaccines.updateOne(filter, update);
          console.log(result)
          res.status(200).send({ data: result });
        }
        if (first_gap !== undefined && second_gap !== undefined && third_gap !== undefined) {
          const update = { $set: { total_dose_number, minimum_age, maximum_age, first_gap, second_gap, third_gap } };
          const result = await vaccines.updateOne(filter, update);
          console.log(result)
          res.status(200).send({ data: result });

        }
        if (first_gap !== undefined && second_gap !== undefined && third_gap !== undefined && fourth_gap !== undefined) {
          const update = { $set: { total_dose_number, minimum_age, maximum_age, first_gap, second_gap, third_gap, fourth_gap } };
          const result = await vaccines.updateOne(filter, update);
          console.log(result)
          res.status(200).send({ data: result });
        }
        if (first_gap !== undefined && second_gap !== undefined && third_gap !== undefined && fourth_gap !== undefined && fifth_gap !== undefined) {
          const update = { $set: { total_dose_number, minimum_age, maximum_age, first_gap, second_gap, third_gap, fourth_gap, fifth_gap } };
          const result = await vaccines.updateOne(filter, update);
          console.log(result)
          res.status(200).send({ data: result });
        }

      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // delete vaccine
    app.delete('/api/admin/vaccine/delete/:vaccine_name', async (req, res) => {
      try {
        const { vaccine_name } = req.params;
        const filter = { vaccine_name: vaccine_name };
        console.log(req.params)
        const result = await vaccines.deleteOne(filter);
        console.log(result)
        res.status(200).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // vaccine added api
    app.post("/api/admin/vaccine/add", async (req, res) => {

      try {

        // console.log(vaccine_name, disease_name, total_dose_number, minimum_age, maximum_age, first_gap, second_gap, third_gap, fourth_gap, fifth_gap)

        const isExistVaccine = await vaccines.findOne({ vaccine_name: req.body.vaccine_name });
        if (!isExistVaccine) {

          const result = await vaccines.insertOne(req.body);

          console.log(result);
          res.status(200).send({ data: result });
        }
        else {
          console.log("Vaccine already exists");
          return res.status(400).send({ message: 'Vaccine already exists' });
        }
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    })


    // get children by parent nid
    app.post('/api/admin/children', async (req, res) => {
      try {
        const nid = req.body.searchString;
        console.log(req.body)
        const filter = { parentNid: nid };
        console.log(filter)
        const result = await childrenCollection.find(filter).toArray();
        res.status(201).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // update child
    app.patch('/api/admin/children/edit', async (req, res) => {
      try {
        const {
          searchChild,
          childName,
          childGender,
          childCertificate,
          dob,
          parentNid } = req.body;

        console.log(childName, childGender, childCertificate, dob, parentNid)
        const filter = { parentNid: parentNid, childName: searchChild };
        const update = { $set: { childName: childName, childGender: childGender, childCertificate: childCertificate, dob: dob, parentNid: parentNid } };
        console.log(update)
        const result = await childrenCollection.updateOne(filter, update);

        res.status(200).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });


    // delete children
    app.delete('/api/admin/children/delete/:nid/:childName', async (req, res) => {
      try {
        const { nid, childName } = req.params;
        const filter = { parentNid: nid, childName: childName };
        console.log(req.params)
        const result = await childrenCollection.deleteOne(filter);
        console.log(result)
        res.status(200).send({ data: result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
      }
    });

    // all complains
    app.post('/api/admin/complains', async (req, res) => {
      try {
        const result = await contactCollection.find({}).toArray();
        res.status(201).send({ data: result });
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