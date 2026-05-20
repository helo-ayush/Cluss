const http = require('http');

const url = 'http://localhost:3000/api/study-plans/6a003fe604a2ce069d51a581';

const req = http.get(url, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(`BODY LENGTH: ${body.length}`);
    try {
      const data = JSON.parse(body);
      console.log('Successfully fetched course from API!');
      console.log('Course title:', data.course ? data.course.title : 'No course');
      console.log('Syllabus/Topics count:', data.course && data.course.syllabus ? data.course.syllabus.length : 0);
      if (data.course && data.course.syllabus) {
        data.course.syllabus.forEach((subtopic, index) => {
          console.log(`Subtopic ${index + 1}: ${subtopic.title} (ID: ${subtopic._id || subtopic.id})`);
        });
      }
    } catch (err) {
      console.log('Failed to parse response body as JSON. Snippet of body:');
      console.log(body.substring(0, 1000));
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});
