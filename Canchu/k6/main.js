// k6 run script.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  discardResponseBodies: true,
  scenarios: {
    contacts: {
      executor: 'constant-arrival-rate',
      rate: 40,
      timeUnit: '1s',
      duration: '20s',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
  insecureSkipTLSVerify: true,
};
// test HTTP
export default function () {
  const accessToken = __ENV.ACCESS_TOKEN;
  const params = {
    headers: {
      'authorization': `Bearer ${accessToken}`,
    },
  };
  const res = http.get('https://13.55.130.82/api/1.0/posts/search', params);
//   const res = http.get('https://scaleTest3-843488763.ap-southeast-2.elb.amazonaws.com/api/1.0/posts/search', params);
console.log(res);
check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}