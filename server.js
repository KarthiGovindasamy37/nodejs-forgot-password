const express=require("express")
const app=express()
const cors=require("cors")
const mongodb=require("mongodb")
const mongoclient=mongodb.MongoClient
const dotenv=require("dotenv").config()
const jwt=require("jsonwebtoken")
const nodemailer=require("nodemailer")
const random=require("randomstring")

let URL=process.env.URL
let DB=process.env.DB
let SECRET=process.env.SECRET
let SERVER=process.env.SERVER
let PASS=process.env.PASS
let USER=process.env.USER

app.use(express.json())
app.use(cors({
    origin:"http://localhost:3000"
}))

let sendEmail=async(mail,res,PASS,temp,USER)=>{
    try {
        
        let transporter=nodemailer.createTransport({
            host:"smtp.gmail.com",
            port:587,
            secure:false,
            auth:{
                user:USER,
                pass: PASS
            }
        });
        
        let info=await transporter.sendMail({
            from:USER,
            to:mail,
            subject:"Reset password link from EPIC.io",
            text:"Please click the link below to reset your password",
            html:`<p>Your temporary password is <b>${temp}</b></p>
                  <p>Copy the temporary password and submit it by clicking the 
                  temporary password link in the forgot password page</p>`
            // `<h5>Please click the link below to reset your password </h5>
            // <a href=${SERVER}/resetpassword/:${token}?email=${mail}>${SERVER}/resetpassword/:${token}?email=${mail}<a/>`
        })
        res.json({message:`mail sent to ${mail}`})
    }
        
     catch (error) {
      res.status(500).json({message:"Something went wrong"})
    }
}
    
app.post("/userlogin",async(req,res)=>{

})

app.post("/forgot",async(req,res)=>{
    console.log("comes")
    try {
        let connection=await mongoclient.connect(URL);

        let db=connection.db(DB);

        let user=await db.collection("users").findOne({email:req.body.email});
        console.log(user);
        if(user){
        //    let token=jwt.sign({email:user.email},SECRET,{expiresIn:"1h"});
        let temp=random.generate(8)
        let mail=user.email 
        await db.collection("users").findOneAndUpdate({email:mail},{$set:{temporaryPassword:temp}})
       
        sendEmail(mail,res,PASS,temp,USER)
        }else{
            
            res.json({message:"User's mail id not valid"})
        }
    } catch (error) {
        
        res.status(500).json({message:"Sorry try again after sometime"})
    }
})

app.post("/reset",async(req,res)=>{
    let pass=req.body.password
    let mail=req.body.email
   
    try {
        let connection=await mongoclient.connect(URL);

        let db=connection.db(DB);

        let user=await db.collection("users").findOne({email:mail})
        
        if(user){
            if(pass==user.temporaryPassword){

                await db.collection("users").findOneAndUpdate({email:user.email},{$unset:{temporaryPassword:""}})
                
                res.json({message:"Please change your password immediately"})
            }else{
                
                res.json({message:"email or password not matched"})
            }
        }else{
            
            res.json({message:"email or password not matched"})
        }
} catch (error) {
        res.status(500).json({message:"Something went wrong,try again"})
    }
})





app.listen(process.env.PORT || 3001)