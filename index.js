// Ov23liwmIxm2EZzA8es9 - client id
// f0e0846f4306acb1dc6190994e6747d242707152 - client secret

const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT | 4000;

const app = express();
app.use(cors());

app.get('/',(req,res)=>{
    res.send('<h1>Welcome to OAuth API Server</h1>')
})

app.get('/auth/github',(req,res)=>{
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user,repo,security_events`;
    res.redirect(githubAuthUrl);
})

app.get('/auth/github/callback',async(req,res)=>{
    const {code} = req.query;
    try{
        const tokenResponse = await axios.post(`https://github.com/login/oauth/access_token`,
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            },
            {
            headers: { Accept: 'application/json'}
            }
        )
        const accessToken = tokenResponse.data.access_token;
        res.cookie('access_token',accessToken); // will set cookie in the client.
        return res.redirect(`${process.env.FRONTEND_URL}/v1/profile/github`)
    }catch(error){
        res.status(500).json(error)
    }
})

app.get('/auth/google', (req,res)=>{
    console.log("inside req")
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}
    &redirect_uri=http://localhost:4000/auth/google/callback&response_type=code&scope=profile email`
    console.log(googleAuthUrl);
    // res.send("hi");
    res.redirect(googleAuthUrl);
})

app.get('/auth/google/callback',async(req,res)=>{
    const {code} = req.query;
    if(!code){
        return res.status(400).send('Authorization code not provided.')
       } 
       let access_token;
    try{
    const tokenResponse = await axios.post(`https://oauth2.googleapis.com/token`,
        {
            client_id:process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: `http://localhost:${PORT}/auth/google/callback`
        },
        {
        headers: {
            "Content-Type":"application/x-www-form-urlencoded"
        }
    },
    )
    access_token = tokenResponse.data.access_token;
    res.cookie("access_token",access_token);
    return res.redirect(`${process.env.FRONTEND_URL}/v1/profile/google`)
    }catch(error){
        console.error(error)
    }
})


app.listen(process.env.PORT,()=>console.log("Server running on port",process.env.PORT));

