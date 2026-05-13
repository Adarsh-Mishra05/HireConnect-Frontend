export const environment = {
  production: false,
  // [Adarsh Mishra] : All API calls go through API Gateway on port 8080
  authServiceBaseUrl: 'http://localhost:8080/api/v1/auth',
  paymentServiceBaseUrl: 'http://localhost:8080/api/payments'
};