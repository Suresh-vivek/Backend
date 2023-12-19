require("dotenv").config();

const express = require("express");

const app = express();

const port = 3000;

const github = {
  login: "Suresh-vivek",
  id: 64722627,
  node_id: "MDQ6VXNlcjY0NzIyNjI3",
  avatar_url: "https://avatars.githubusercontent.com/u/64722627?v=4",
  gravatar_id: "",
  url: "https://api.github.com/users/Suresh-vivek",
  html_url: "https://github.com/Suresh-vivek",
  followers_url: "https://api.github.com/users/Suresh-vivek/followers",
  following_url:
    "https://api.github.com/users/Suresh-vivek/following{/other_user}",
  gists_url: "https://api.github.com/users/Suresh-vivek/gists{/gist_id}",
  starred_url:
    "https://api.github.com/users/Suresh-vivek/starred{/owner}{/repo}",
  subscriptions_url: "https://api.github.com/users/Suresh-vivek/subscriptions",
  organizations_url: "https://api.github.com/users/Suresh-vivek/orgs",
  repos_url: "https://api.github.com/users/Suresh-vivek/repos",
  events_url: "https://api.github.com/users/Suresh-vivek/events{/privacy}",
  received_events_url:
    "https://api.github.com/users/Suresh-vivek/received_events",
  type: "User",
  site_admin: false,
  name: "Vivek",
  company: null,
  blog: "",
  location: null,
  email: null,
  hireable: null,
  bio: null,
  twitter_username: null,
  public_repos: 44,
  public_gists: 0,
  followers: 5,
  following: 21,
  created_at: "2020-05-03T06:07:04Z",
  updated_at: "2023-12-12T12:52:47Z",
};

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.get("/twitter", (req, res) => {
  res.send("Hello Twitter");
});

app.get("/login", (req, res) => {
  res.send("<h1>Welocome to Chai aur code </h1>");
});

app.get("/youtube", (req, res) => {
  res.send("<h2> Chai aur code.</h2>");
});

app.get("/github", (req, res) => {
  res.json(github);
});
app.listen(process.env.PORT, () => {
  console.log(`Example app is listening on port ${process.env.PORT}`);
});
