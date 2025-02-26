const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser")
const {setSecureCookie} = require("./services/index.js")
const {verifyAccessToken} = require("./middleware/index.js")
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT | 4000;

const app = express();
app.use(cors({credentials: true, origin: ["https://oauth-frontend.vercel.app","https://memories-fe-pi.vercel.app","http://localhost:3000"]}));
app.use(cookieParser());

app.get('/',(req,res)=>{
    res.send('<h1>Welcome to OAuth API Server</h1>')
})

app.get("/user/profile/github",verifyAccessToken ,async(req,res)=>{
    try{
        const {access_token} = req.cookies;
        const {id,name,email,picture} = jwt.verify(access_token,process.env.JWT_SECRET);
        const githubUserDataResponse = await axios.get('https://api.github.com/user', 
            {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            }
        )
        res.json({user:githubUserDataResponse.data});
    }catch(error){
        res.status(500).json({error: "Could not fetch user Github profile."})
    }
})

app.get("/user/profile/google",verifyAccessToken ,async(req,res)=>{
    try{
        const {access_token} = req.cookies;
        const {id,name,email,picture} = jwt.verify(access_token,process.env.JWT_SECRET);
        // console.log('Details inside user profile', id,name,email,picture)
        // res.status(200);
        // const {access_token} = req.cookies;
        // const googleUserDataResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', 
        //     {
        //         headers: {
        //             Authorization: `Bearer ${access_token}`
        //         }
        //     }
        // )
        res.json({user:{id,name,email,picture}});
    }catch(error){
        res.status(500).json({error: "Could not fetch user Google profile."})
    }
})

app.get('/auth/github',(req,res)=>{
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user,repo,security_events`;
    res.redirect(githubAuthUrl);
})

app.get('/auth/github/callback',async(req,res)=>{
    const {code} = req.query;
    if(!code){
        return res.status(400).send('Authorization code not provided.')
       } 
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

        setSecureCookie(res,accessToken)
        // res.cookie('access_token',accessToken); // will set cookie in the client.
        return res.redirect(`${process.env.FRONTEND_URL}/v2/profile/github`)
    }catch(error){
        res.status(500).json(error)
    }
})

app.get('/auth/google', (req,res)=>{
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.BACKEND_URL}/api/auth/google/callback&response_type=code&scope=profile email`
    // res.send("hi");
    res.redirect(googleAuthUrl);
})

app.get('/api/auth/google/callback',async(req,res)=>{
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
            redirect_uri: `${process.env.BACKEND_URL}/api/auth/google/callback`
        },
        {
        headers: {
            "Content-Type":"application/x-www-form-urlencoded"
        }
    },
    )
    access_token = tokenResponse.data.access_token;
    const googleUserDataResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', 
        {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        }
    )
    const {id,name,email,picture} = googleUserDataResponse.data;
    const jwtToken = await jwt.sign({id,email,name,picture},process.env.JWT_SECRET,{expiresIn:"12h"})
    setSecureCookie(res,jwtToken);
    // res.cookie("access_token",access_token);
    // return res.redirect(`${process.env.FRONTEND_URL}/v2/profile/google`)
    return res.redirect(`${process.env.FRONTEND_URL}`)
    }catch(error){
        console.error(error)
    }
})


app.listen(process.env.PORT,()=>console.log("Server running on port",process.env.PORT));

