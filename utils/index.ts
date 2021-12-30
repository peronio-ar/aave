import fs from 'fs';
// import { networkConfig } from '../helper-hardhat-config';

const deploymentsDir = './deployments';

const getJSON = (filePath: string): any => {
  const contract = fs.readFileSync(filePath).toString();
  return JSON.parse(contract);
};

const getDeployedContract = (
  contractName: string,
  newtworkName: string
): any => {
  return getJSON(`${deploymentsDir}/${newtworkName}/${contractName}.json`);
};

export { getDeployedContract, getJSON };
