// import * as PlayHT from 'playht';
// //import fs from 'fs';

// // Initialize client
// PlayHT.init({
//   userId: 'c4tWRiKDPdXnmkX8A4tBaMukT7k1',
//   apiKey: '6b91dd8a331249ff9623014eb8533293',
// });

// async function streamAudio(text) {
//   const stream = await PlayHT.stream('All human wisdom is summed up in these two words: Wait and hope.', { voiceEngine: 'PlayDialog' });
//   stream.on('data', (chunk) => {
//     // Do whatever you want with the stream, you could save it to a file, stream it in realtime to the browser or app, or to a telephony system
//     fs.appendFileSync('output.mp3', chunk);
//   });
//   return stream;
// }