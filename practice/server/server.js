const fs = require("node:fs/promises");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors('*'));
// app.use(express.json());
app.use(express.json({ limit: '50mb' }));


let metaData ;

app.get("/",async (req,res)=>{
    const path = __dirname.replace(/server/,'client\\index.html');
    res.sendFile(path);
}) 

app.post("/metadata",(req,res) =>{
    const { fileName , fileSize , fileType} = req.body;
    if(fileName && fileSize && fileType){
        metaData = req.body
        res.status(200).json({message : "Data recived successfully"});
    }else{
        res.status(400).json({error : "No data recivied"})
    }
})

app.post("/upload",async (req,res) =>{
    if(metaData){ 
        const path = __dirname.replace(/server/,`storage\\${metaData.fileName}`);
        const file = await fs.open(path,"w");
        const stream = file.createWriteStream();
        req.on("data",(chunk)=>{
            console.log(chunk);
            if(!stream.write(chunk)){
                req.pause();
            }
        })
        stream.on("drain",()=>{
            req.resume();
        })
        req.on("end",()=>{
            metaData = undefined;
            res.status(200).json({message : "File upload successfully"});
            file.close();
        })
    }else{
        res.status(400).json({error : "metadata not yet recived "+metaData})
    }
})


app.listen(3040 , "127.0.0.1 " ,() =>{
    console.log("http://127.0.0.1:3040")
})

