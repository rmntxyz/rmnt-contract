import * as dotenv from "dotenv";

dotenv.config();

export const NETWORK_MAP = {
  1: 'mainnet',
  5: 'goerli',
  137: 'polygon mainnet',
  80001: 'polygon mumbai',
  1337: 'hardhat',
  31337: 'hardhat',
};

const API_URI = 'https://rmnt.herokuapp.com/api';
const TEST_API_URI = 'http://localhost:1337/api';

export const API_URI_MAP = {
  1: API_URI,
  5: API_URI,
  137: API_URI,
  80001: API_URI,
  1337: TEST_API_URI,
  31337: TEST_API_URI,
}

export const API_ACCESS_TOKEN_MAP = {
  1: process.env.STRAPI_ACCESS_TOKEN,
  5: process.env.STRAPI_ACCESS_TOKEN,
  137: process.env.STRAPI_ACCESS_TOKEN,
  80001: process.env.STRAPI_ACCESS_TOKEN,
  1337: process.env.STRAPI_DEV_ACCESS_TOKEN,
  31337: process.env.STRAPI_DEV_ACCESS_TOKEN,
}