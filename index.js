let http = require('http')
let request = require('request')
let path = require('path')
let fs = require('fs')
let through =require('through')
let argv = require('yargs')
    .default('host', 'localhost')
    .argv
let logStream = argv.serverlog ? fs.createWriteStream(argv.serverlog) : process.stdout
let scheme = 'http://'
let port = argv.port || (argv.host === 'localhost' ? 8000 : 80)
let destinationUrl = argv.url || scheme + argv.host + ':'+port

//Echo server
http.createServer((req,res) => {
console.log(`Request received at: ${req.url}`)

for (let header in req.headers) {
    res.setHeader(header, req.headers[header])
}

logStream.write('\n\n\n'+ JSON.stringify(req.headers))
//req.pipe(process.stdout)
through(req,logStream,{autoDestroy: false})
req.pipe(res)
}).listen(8000)

//Proxy Server
http.createServer((req,res) => {

let dest=destinationUrl
if(req.headers['x-destination-url']){
	dest=req.headers['x-destination-url']
}

let options = {

	headers: req.headers,
	url: `${dest}${req.url}`	

}
options.method = req.method
let downstreamResponse = req.pipe(request(options))
logStream.write('Headers from destination: \n\n' + JSON.stringify(downstreamResponse.headers)+'\n\n')
downstreamResponse.pipe(res)
through(downstreamResponse,logStream,{autoDestroy: false})
}).listen(8001)