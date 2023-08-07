
// const str = "I am Shuiab";


// const encoder = new TextEncoder();
// const uint8arrayEncoded = encoder.encode(str);

// console.log(uint8arrayEncoded);

    // const decoder = new TextDecoder("utf-8");
    // const uint8arrayDecoded = decoder.decode(uint8array)
// console.log(uint8arrayDecoded);


// blob


// const blob = new Blob(["<html><head></head><body></body></html>"],{ type : "text/html"});
// console.log(blob)


// const extract = blob.slice(0,2,"text/html")
// console.log(extract)


const button = document.getElementById("btn");

const dowloading = (filename) =>{
    const anchorTag = document.createElement("a");
    anchorTag.download = filename;
    const blob = new Blob(["hello from javascript"],{type : "text/plain"});
    const url = URL.createObjectURL(blob);
    anchorTag.href = url;
    anchorTag.click();
    URL.revokeObjectURL(anchorTag.href)
}

button.addEventListener("click",async() =>{
    // dowloading("shuaib.txt")
    // const response = await fetch("http://localhost:3040/streaming?movieName=dashavideo.mp4");
    // if(response.ok){
    //     console.log(response.status)
    // }else{
    //     const data = await response.json();
    //     console.log(data)
    // }
})



    // // true
    // {
    //     var x = 12;
    // }
    // console.log(x)

    // // false and x is not defined
    // {
    //     let y = 10;
    // }
    // console.log(y)