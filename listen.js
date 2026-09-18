const http = require('http');
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    console.log("RECEIVED ERROR:", body);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end("OK");
  });
});
server.listen(8080, () => console.log('Listening on 8080...'));
setTimeout(() => process.exit(0), 15000); // exit after 15s
