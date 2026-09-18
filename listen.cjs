const http = require('http');
const fs = require('fs');
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    fs.writeFileSync('error_output.txt', body);
    console.log("RECEIVED ERROR:", body);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end("OK");
    process.exit(0);
  });
});
server.listen(8080, () => console.log('Listening on 8080...'));
setTimeout(() => { console.log('Timeout'); process.exit(1); }, 60000);
