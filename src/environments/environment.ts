export const environment = {
  production: false,
  // [Adarsh Mishra] : All API calls go through API Gateway on port 8080
  authServiceBaseUrl: 'http://hireconnect.duckdns.org:8080/api/v1/auth',
  paymentServiceBaseUrl: 'http://hireconnect.duckdns.org:8080/api/payments'
};