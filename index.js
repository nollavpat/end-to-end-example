require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Web3 = require('web3');

// express stuff
const app = express();
const port = 3000;

// web3 stuff
// const chainUrl = 'ws://localhost:8545'; // change to your own chain url
const chainUrl = process.env.CHAIN_URL; // change to your own chain url
const web3 = new Web3(chainUrl);
const coinsABI = require('./contracts/JairusCoin.json');
// const contractAddress = '0xBb298610f56Ed44Be7D7419D729dd5ddF6a4C03F'; // add contract address
const contractAddress = process.env.CONTRACT_ADDRESS; // add contract address
const coinsContract = new web3.eth.Contract(
    coinsABI,
    contractAddress,
);

// db stuff
// const minterAddress = '0x9a7b81395c69aBb692614089c5671A2EEcdfE079';
const minterAddress = process.env.MINTER_ADDRESS;
const db = {
  users: [
    {
      username: 'admin',
      password: 'admin',
      role: 'admin',
      address: minterAddress, // add minter address
    },
    {
      username: 'user1',
      password: 'test',
      role: 'customer',
      address: '0x32Ef320A3b5F5921cBe1bc772DC51A81943E0058',
    },
    {
      username: 'user2',
      password: 'test',
      role: 'customer',
      address: '0x7386c4680801fbC6eeAcFE493fBc7687f58af6dA',
    },
  ],
};


app.use(bodyParser.json()); // middleware
app.use(cors()); // default allow all
app.use(express.static('public'));

app.get('/example', async (req, res) => {
  const accounts = await web3.eth.getAccounts();

  console.log(accounts);

  res.send('Hello World!');
});

// get the balance of the logged in user
app.get('/coins/:address', async (req, res) => {
  console.log(req.params);
  const balance = await coinsContract.methods.balances(req.params.address).call();

  res.status(200).json({
    message: 'Successfully retrieved balance',
    balance: Number(balance),
  });
});

// transfer coins
app.post('/coins/transfer', async (req, res) => {
  // send otp
  const user = db.users.find((user) => {
    return user.username === req.body.username && user.password === req.body.password;
  });
  const isUserNotCustomer = user.role === 'admin'

  if (isUserNotCustomer === true) {
    return res.status(403).json({
      message: 'Not customer'
    });
  }

  await coinsContract.methods.send(req.body.receiver, req.body.amount).send({from: user.address});

  // send sms, email

  res.status(200).json({
    message: 'Successfully transferred amount!',
    user: user,
  });
});

// mint coins
app.post('/coins/mint', async (req, res) => {
  const isAddressNotValid = req.body.receiver.length !== 42;

  if (isAddressNotValid === true) {
    return res.status(400).json({
      message: 'VALIDATION ERROR, MALI ADDRES MO'
    });
  }

  const user = db.users.find((user) => {
    return user.username === req.body.username && user.password === req.body.password;
  });
  const isUserNotAdmin = user.role !== 'admin'

  if (isUserNotAdmin === true) {
    return res.status(403).json({
      message: 'Not admin'
    });
  }

  try {
    await coinsContract.methods.mint(req.body.receiver, req.body.amount).send({from: user.address});
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Server Error'
    });
  }

  res.status(200).json({
    message: 'Successfully mint!',
    user: user,
  });
});

// create a user
app.post('/users', async (req, res) => {
  console.log(req.body);
  const ethUser = web3.eth.accounts.create();
  console.log(ethUser);

  const isUserExist = db.users.find((user) => {
    return user.username === req.body.username;
  });

  if (isUserExist) {
    return res.status(400).json({
      message: 'User already exist!',
    });
  }

  db.users.push({
    username: req.body.username,
    password: req.body.password,
    address: ethUser.address,
  });

  console.log(db.users);

  res.status(201).json({
    message: 'Successfully created a user',
  });
});

// get list of users and their addresses
app.get('/users', async (req, res) => {
  const users = db.users
      .filter((user) => {
        return user.role !== 'admin';
      })
      .map((user) => {
        return {
          username: user.username,
          address: user.address,
        };
      });

  res.status(200).json({
    message: 'Successfully retrieved users',
    users: users,
  });
});

app.post('/login', () => {
  /**
   * 1. validate if may user sa db na given username, password
   * 2. using user credentials, make jwt
   */
});

app.post('/logout', () => {
  // invalidate token
});


app.listen(port, () => { // serve
  console.log(`Example app listening at http://localhost:${port}`);
});


/**
 * blockchain
 * balances = {address: amount}
 *
 * database
 * users
 *  id        name     age
 *  address   jairus    xx
 */