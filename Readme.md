# Part 1 - Backend

Clone repository
```bash
git clone https://github.com/nollavpat/end-to-end-example.git
cd end-to-end-example
npm install
```

Create basic express app [expressjs docs](https://expressjs.com/en/starter/hello-world.html)
```js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.get('/example', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
```

Test API
```bash
npm start
# on another terminal tab
curl http://localhost:3000/example
```

Connect to web3
```js
const Web3 = require('web3');

const chainUrl = 'ws://localhost:8545'; // change to your own chain url
const web3 = new Web3(chainUrl);

// update endpoint
app.get('/example', async (req, res) => {
  const accounts = await web3.eth.getAccounts();

  console.log(accounts);

  res.send('Hello World!');
});
```

Set up coins contract
```js
const coinsABI = require('./contracts/JairusCoin.json');

const contractAddress = ''; // add contract address
const coinsContract = new web3.eth.Contract(
    coinsABI,
    contractAddress,
);
```

API boilerplate
```js
// get the balance of the logged in user
app.get('/coins', async (req, res) => {});

// transfer coins
app.post('/coins/transfer', async (req, res) => {});

// mint coins
app.post('/coins/mint', async (req, res) => {});

// create a user
app.post('/users', async (req, res) => {});

// get list of users and their addresses
app.get('/users', async (req, res) => {});
```

Create database (for demo purposes)
```js
const db = {
  users: [
    {
      username: 'admin',
      password: 'admin',
      role: 'admin',
      address: '', // add minter address
    }
  ],
};
```

Create a user and get users
```js
// create a user
app.post('/users', async (req, res) => {
  db.users.push({
    username: req.body.username,
    password: req.body.password,
    address: ''
  });

  res.status(201).json({
    message: 'Successfully created a user',
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
```

Create address for new user
```js
// create a user
app.post('/users', async (req, res) => {
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
```

Update coins endpoints
```js
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
```