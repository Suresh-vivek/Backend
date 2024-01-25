import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("Server is ready");
});

//get a list of five jokes
app.get("/api /jokes", (req, res) => {
  const jokes = [
    { id: 1, title: "A Joke", content: "This is a joke" },

    { id: 2, title: "Another Joke", content: "This is another joke" },

    { id: 3, title: "A third Joke", content: "This is a third joke" },

    { id: 4, title: "A fourth Joke", content: "This is a fourth joke" },

    { id: 5, title: "A fifth Joke", content: "This is a fifth joke" },
  ];

  res.send(jokes);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server at http://localhost:3000");
});
