// // const cloudinary = require('cloudinary').v2;

// // cloudinary.config({
// //   cloud_name: 'dzvrz4pme',
// //   api_key: '479995598133472',
// //   api_secret: 'rHi57ylFbsi4qxiQfcN-ml_44jo',
// // });

// // async function main() {
// //   const url1 = cloudinary.url('instructor1', {
// //     secure: true,
// //     sign_url: true,
// //     type: 'authenticated',
// //     auth_token: { duration: 300, key: '', ip: '119.73.98.204' },
// //   });
// //   console.log(url1);
// //   // const timestamp = Math.round(Date.now() / 1000);
// //   // const signature = cloudinary.utils.api_sign_request(
// //   //   {
// //   //     timestamp,
// //   //     resource_type: 'image',
// //   //     type: 'authenticated',
// //   //   },
// //   //   'rHi57ylFbsi4qxiQfcN-ml_44jo',
// //   // );
// //   // try {
// //   //   const url1 = await cloudinary.uploader.explicit('samples/bike', {
// //   //     type: 'upload',
// //   //     resource_type: 'video',
// //   //   });
// //   //   console.log(url1);
// //   // } catch (err) {
// //   //   console.log('**** ERROR ****');
// //   //   console.log(err);
// //   // }
// // }

// // main();

// // const axios = require('axios');

// // // Anonymous test key. Replace with your key.
// // const SECRET_KEY = 'sk_test_960bfde0VBrLlpK098e4ffeb53e1';

// // async function main() {
// //   try {
// //     const res = await axios.post(
// //       'https://online.yoco.com/v1/charges/',
// //       {
// //         token: 'tok_test_DjaqoUgmzwYkwesr3euMxyUV4g',
// //         amountInCents: 2799,
// //         currency: 'ZAR',
// //       },
// //       {
// //         headers: {
// //           'X-Auth-Secret-Key': SECRET_KEY,
// //         },
// //       },
// //     );
// //     console.log(res);
// //   } catch (err) {
// //     console.log('--------- Error found -----------');
// //     console.log(err.response.data);
// //   }
// // }

// // main();

// const dayjs = require('dayjs');
// const { chain } = require('lodash');
// const { groupBy, omitBy, round, reduce, take } = require('lodash');

// const meta = {
//   courses: [
//     {
//       id: 1,
//       bundleId: 5,
//       bundle: 'Bundle 5 title',
//       course: 'Course 1 title',
//       bundlePrice: 200,
//       months: 5,
//     },
//     {
//       id: 1,
//       course: 'Course 1 title',
//       months: 5,
//     },
//     {
//       id: 6,
//       bundleId: 5,
//       bundle: 'Bundle 5 title',
//       course: 'Course 1 title',
//       bundlePrice: 200,
//       months: 6,
//     },
//     {
//       id: 7,
//       bundleId: 5,
//       bundle: 'Bundle 5 title',
//       course: 'Course 1 title',
//       bundlePrice: 200,
//       months: 5,
//     },
//     {
//       id: 7,
//       bundleId: 6,
//       bundle: 'Bundle 5 title',
//       course: 'Course 1 title',
//       bundlePrice: 300,
//       months: 5,
//     },
//     {
//       id: 7,
//       bundleId: 6,
//       bundle: 'Bundle 5 title',
//       course: 'Course 1 title',
//       bundlePrice: 300,
//       months: 5,
//     },
//     {
//       id: 2,
//       months: 5,
//       course: 'Course 1 title',
//     },
//   ],
//   products: [],
// };

// function main() {
//   // const bundlesMeta = chain(meta.courses)
//   //   .groupBy('bundleId')
//   //   .omitBy((v, k) => k === 'undefined')
//   //   .map((g) => g[0])
//   //   .value();
//   // console.log(bundlesMeta);
//   // const now = dayjs(new Date());
//   // const exp = dayjs(new Date('2023-07-31 19:29:19.484'));
//   // console.log(exp.diff());
//   console.log(take(undefined, 1));
// }

// main();

// // {
// //   "id" : "sub_4EX8D0aaZjoC9KAiYdF4ZlEN",
// //   "name" : "lms-yoco-webhok",
// //   "url" : "https://api.graviton.pk/payment/yoco-webhook",
// //   "mode" : "test",
// //   "secret" : "whsec_RTI1MjBBRkYzRDg4MEJEOEM0REY2MDIyNjY3NTU3NzA="
// // }%

const dayjs = require('dayjs');

console.log(new Date().getD);
