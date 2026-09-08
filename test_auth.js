const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/signin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  res.on('data', (d) => process.stdout.write(d));
});

req.write(JSON.stringify({}));
req.end();
