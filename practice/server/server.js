const fs = require("node:fs/promises");
const os = require("node:os");
const getInternalIP = () =>{
    const interfaces = os.networkInterfaces();
    for(const name of Object.keys(interfaces)){
        for(const iface of interfaces[name]){
            if(iface.family === "IPv4" && !iface.internal){
                return iface.address;
            }
        }
    }
    return "127.0.0.1";
}
const internalIP = getInternalIP();
const express = require("express");
const cors = require("cors");
const { WebSocketServer , OPEN} = require("ws");
const { registerQuery , connection } = require("D:/signUpLogIn/dbConnect");

const app = express();

app.use(cors('*'));
// app.use(express.json());
app.use(express.json({ limit: '50mb' }));

const server = app.listen(3090,internalIP,() =>{
    console.log("\n",server.address());
})

const wss = new WebSocketServer({ server })

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
            // console.log(chunk);
            if(!stream.write(chunk)){
                req.pause();
            }
        })
        stream.on("drain",()=>{
            req.resume();
        })
        req.on("end",()=>{
            const { fileName , fileSize , fileType} = metaData;
            registerQuery(fileName,fileType,fileSize);
            metaData = undefined;
            res.status(200).json({message : "File upload successfully"});
            file.close();
        })
    }else{
        res.status(400).json({error : "metadata not yet recived "+metaData})
    }
})

app.get("/movieMetadata",(req,res) =>{
    const dbQuery = "SELECT movie_id,movie_name FROM movie";
    connection.query(dbQuery,(err,result) =>{
        res.status(200).send(result)
    })
})

app.get("/streaming",async(req,res) =>{
    const {  movieName } = req.query;
    if(movieName){
        try {
            const filePath =  __dirname.replace(/server/,`storage\\${movieName}`);
            const file = await fs.open(filePath,"r");
            const fileSize = (await fs.stat(filePath)).size;
        
            res.statusCode = 200;
            res.setHeader("Content-Type", "video/mp4");
            res.setHeader("Content-Length", fileSize);
            res.setHeader("Accept-Ranges", "bytes");
        
        
            const range = req.headers.range;
        
            if(range){
                const parts = range.replace(/bytes=/,"").split("-");
                const start = parseInt(parts[0],10);
                const end = parts[1] ? parseInt(parts[1],10) : fileSize - 1;
        
                res.statusCode = 206;
                res.setHeader("Content-Type", "video/mp4");
                res.setHeader("Content-Range" , `bytes ${start}-${end}/${fileSize}`);
                res.setHeader("Content-Length", fileSize - 1);
                const stream = file.createReadStream({start , end });
                stream.on("data",(chunk) =>{
                    res.write(chunk);
                })
                req.on("pause",()=>{
                    stream.pause();
                })
                req.on("resume",()=>{
                    stream.resume();
                })
                stream.on("error",(err) =>{
                    res.status(400).json(JSON.stringify({"error" : err}));
                    res.end();
                })
                stream.on("end",()=>{
                    res.end();
                    file.close();
                })
                
            }else{
                const stream = file.createReadStream({ highWaterMark: 16000 });
                stream.on("data", (chunk) => {
                    res.write(chunk);
                });
                req.on("pause",()=>{
                    stream.pause();
                })
                req.on("resume",()=>{
                    stream.resume();
                })
                stream.on("error",(err) =>{
                    res.status(400).json(JSON.stringify({"error" : err}));
                    res.end();
                })
                stream.on("end",()=>{
                    res.end();
                    file.close();
                })
            }
        } catch (error) {
            if(error.errno === -4058){
                 res.status(400).json({error: "no such file or directory"});
            }
        }
    }else{
        res.status(400).json({error: "wrong request"});
    }
});


app.delete("/deleting",async (req,res) =>{
    const {  movieName } = req.body;
    if(movieName){
        try{
            const filePath =  __dirname.replace(/server/,`storage\\${movieName}`);
            await fs.rm(filePath);
            const dbQuery = 'DELETE FROM movie WHERE movie_name = ?';
            connection.query(dbQuery,[movieName]);
            res.status(200).json({ success : `${movieName} successfully deleted`});
        }catch(error){
            res.status(400).json({error: error});
        }
    }else{
        res.status(400).json({error: "wrong request"});
    }
})
app.get("/internalip",(req,res)=>{
    if(internalIP){
        res.status(200).json({ip : internalIP});
    }else{
        res.status(400).json({error: "Error in using the internalIP"});
    }
});
// const allClients = [];

wss.on("connection", (ws,req) =>{
    // allClients.push(ws);
    const ip = req.socket.remoteAddress
    console.log("A new client was connected ",ip);

    const dbQuery = "SELECT movie_id,movie_name FROM movie";
    connection.query(dbQuery,(err,result) =>{
        const json = JSON.stringify(result)
        ws.send(json)
    })

    // broadcating to all the client connected
    // allClients.map(client =>{
    //     if(client.readyState === OPEN)
            // connection.query(dbQuery,(err,result) =>{
            //     const json = JSON.stringify(result)
            //     client.send(json)
            // });
    // })
    
    // same concept as above 
    wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === OPEN) {
            connection.query(dbQuery,(err,result) =>{
                const json = JSON.stringify(result)
                client.send(json)
            });
        }
    });
})  





