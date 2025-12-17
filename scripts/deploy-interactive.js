#!/usr/bin/env node

const readline = require("readline");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function selectNetwork() {
  console.log(
    `${colors.cyan}${colors.bright}========================================${colors.reset}`
  );
  console.log(
    `${colors.blue}${colors.bright}Interactive Subgraph Deployment${colors.reset}`
  );
  console.log(
    `${colors.cyan}========================================${colors.reset}\n`
  );

  console.log(`${colors.yellow}Available networks:${colors.reset}`);
  console.log("  1) mainnet");
  console.log("  2) base");
  console.log("  3) arbitrum-one");
  console.log();

  const choice = await prompt(
    `${colors.cyan}Select network (1-3): ${colors.reset}`
  );

  const networks = {
    1: "mainnet",
    2: "base",
    3: "arbitrum-one",
  };

  const network = networks[choice.trim()];

  if (!network) {
    console.error(
      `${colors.red}Invalid selection. Please choose 1, 2, or 3.${colors.reset}`
    );
    return selectNetwork();
  }

  return network;
}

async function getVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
  );
  const defaultVersion = packageJson.version;

  const version = await prompt(
    `${colors.cyan}Enter version [${defaultVersion}]: ${colors.reset}`
  );

  return version.trim() || defaultVersion;
}

async function deploy(network, version) {
  console.log();
  console.log(`${colors.green}Starting deployment...${colors.reset}`);
  console.log();

  return new Promise((resolve, reject) => {
    const deployScript = path.join(__dirname, "deploy.js");
    const child = spawn(
      "node",
      [deployScript, "--network", network, "--version", version],
      {
        stdio: "inherit",
      }
    );

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Deployment failed with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    const network = await selectNetwork();
    const version = await getVersion();

    console.log();
    console.log(`${colors.yellow}Deployment configuration:${colors.reset}`);
    console.log(`  ${colors.blue}Network:${colors.reset} ${network}`);
    console.log(`  ${colors.blue}Version:${colors.reset} ${version}`);
    console.log();

    const confirm = await prompt(
      `${colors.cyan}Proceed with deployment? (y/n): ${colors.reset}`
    );

    if (confirm.toLowerCase() !== "y") {
      console.log(`${colors.yellow}Deployment cancelled.${colors.reset}`);
      rl.close();
      process.exit(0);
    }

    await deploy(network, version);
    rl.close();
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    rl.close();
    process.exit(1);
  }
}

main();
