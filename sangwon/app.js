require("dotenv").config();

const http = require("http");

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { DataSource } = require("typeorm");

const mysqlDataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
});

mysqlDataSource.initialize()
  .then(() => {
  console.log("Data Source has been initialized!");
  })
  .catch((err)=>{
  console.log("Error during Data Source initialization",err)
  })

const app = express();

app.use(express.json()); 
app.use(cors());
app.use(morgan("dev"));


app.get("/ping", (req, res) => {
  return res.status(200).json({ message: "pong" });
});

app.post('/users/signup', async (req, res) => {
	const { name, email, password, profile_image} = req.body
    
	await mysqlDataSource.query(
		`INSERT INTO users(
      name,
      email,
      password,
      profile_image
		) VALUES (?, ?, ?, ?);
		`,
		[ name, email, password, profile_image ]
	); 
    return res.status(201).json({ message : "successfully created" });
	})


const server = http.createServer(app);
const PORT = process.env.PORT;

const start = async () => {
  server.listen(PORT, () => console.log(`server is listening on ${PORT}`));
};

start();
