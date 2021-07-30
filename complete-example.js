const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const coinsABI = require('./contracts/JairusCoin.json');

const app = express();
const port = 3000;

const chainUrl = 'ws://localhost:8545';
const web3 = new Web3(chainUrl);
const contractAddress = '0x3987d82F8a4BE0c169e50c1bbeFdB4834C9e095F';
const coinsContract = new web3.eth.Contract(
    coinsABI,
    contractAddress,
);
const minterAddress = '0xC2bEAda70548874655Eca42602461100389b2b56';
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
      role: 'user',
      address: '0x62a013FDF9c9678C1da69281e1ca633fa8CFd926',
    },
    {
      username: 'user2',
      password: 'test',
      role: 'user',
      address: '0xCB8FD8e048EFF4c9c3442a0b1E7b697DE4Ec51d8',
    },
  ],
};

app.use(bodyParser.json());

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
    message: 'Successfully get address balance',
    balance: balance,
  });
});

// transfer coins
app.post('/coins/transfer', async (req, res) => {
  const user = db.users.find((user) => {
    return user.username === req.body.username && user.password === req.body.password;
  });

  if (!user) {
    res.status(401).json({
      message: 'Username/password is incorrect',
    });
  }

  console.log(req.body);

  await coinsContract.methods.send(req.body.receiver, Number(req.body.amount)).send({from: user.address});

  res.status(200).json({
    message: 'Successfully minted coins',
  });
});

// mint coins
app.post('/coins/mint', async (req, res) => {
  const user = db.users.find((user) => {
    return user.username === req.body.username && user.password === req.body.password;
  });

  if (!user) {
    res.status(401).json({
      message: 'Username/password is incorrect',
    });
  }

  if (user.role !== 'admin') {
    res.status(403).json({
      message: 'You are not the minter',
    });
  }

  console.log(req.body);

  await coinsContract.methods.mint(req.body.receiver, Number(req.body.amount)).send({from: minterAddress});

  res.status(200).json({
    message: 'Successfully minted coins',
  });
});

// create a user
app.post('/users', async (req, res) => {
  const isUserExist = db.users.find((user) => {
    return user.username === req.body.username;
  });
  if (isUserExist) {
    res.status(400).json({
      message: 'Username already exist',
    });
  }

  const ethUser = web3.eth.accounts.create();
  console.log(ethUser);

  db.users.push({
    username: req.body.username,
    password: req.body.password,
    address: ethUser.address,
  });

  res.status(201).json({
    message: 'Successfully created a user',
    address: ethUser.address,
  });
});

// get list of users and their addresses
app.get('/users', async (req, res) => {
  res.status(200).json({
    message: 'Successfully retrieved users',
    users: db.users.map((user) => {
      return {username: user.username, address: user.address};
    }),
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});