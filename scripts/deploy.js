#!/usr/bin/env node

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

// Parse command line arguments
const args = process.argv.slice(2);
const networkIndex = args.indexOf("--network");
const versionIndex = args.indexOf("--version");

// Validate network argument
if (networkIndex === -1 || networkIndex === args.length - 1) {
  console.error(
    `${colors.red}Error: --network argument is required${colors.reset}`
  );
  console.log(
    "Usage: node scripts/deploy.js --network <mainnet|base|arbitrum-one> [--version <version>]"
  );
  process.exit(1);
}

const network = args[networkIndex + 1];
const validNetworks = ["mainnet", "base", "arbitrum-one"];

if (!validNetworks.includes(network)) {
  console.error(
    `${colors.red}Error: Invalid network '${network}'${colors.reset}`
  );
  console.log(`Valid networks: ${validNetworks.join(", ")}`);
  process.exit(1);
}

// Get version from command line or package.json
let version;
if (versionIndex !== -1 && versionIndex !== args.length - 1) {
  version = args[versionIndex + 1];
} else {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
  );
  version = packageJson.version;
}

const subgraphName = `reserve-${network}`;

// Display deployment information
console.log(
  `${colors.cyan}${colors.bright}========================================${colors.reset}`
);
console.log(
  `${colors.blue}${colors.bright}Deploying Subgraph to Goldsky${colors.reset}`
);
console.log(
  `${colors.cyan}========================================${colors.reset}`
);
console.log(`${colors.yellow}Network:${colors.reset} ${network}`);
console.log(`${colors.yellow}Version:${colors.reset} ${version}`);
console.log(
  `${colors.yellow}Subgraph:${colors.reset} ${subgraphName}/${version}`
);
console.log(
  `${colors.cyan}========================================${colors.reset}\n`
);

// Execute command with live output
function executeCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}⏳ ${description}...${colors.reset}`);

    const child = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    child.stdout.on("data", (data) => {
      process.stdout.write(data);
    });

    child.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(
          `${colors.green}✓ ${description} completed successfully${colors.reset}\n`
        );
        resolve();
      } else {
        console.log(
          `${colors.red}✗ ${description} failed with code ${code}${colors.reset}\n`
        );
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on("error", (err) => {
      console.error(
        `${colors.red}✗ Failed to execute command: ${err.message}${colors.reset}`
      );
      reject(err);
    });
  });
}

async function deploy() {
  try {
    // Step 1: Run codegen
    await executeCommand("npm", ["run", "codegen"], "Running codegen");

    // Step 2: Build the subgraph for the network
    await executeCommand(
      "npx",
      ["graph", "build", "--network", network],
      `Building subgraph for ${network}`
    );

    // Step 3: Deploy to Goldsky
    await executeCommand(
      "goldsky",
      ["subgraph", "deploy", `${subgraphName}/${version}`, "--path", "."],
      `Deploying to Goldsky as ${subgraphName}/${version}`
    );

    console.log(
      `${colors.green}${colors.bright}========================================${colors.reset}`
    );
    console.log(
      `${colors.green}${colors.bright}✓ Deployment completed successfully!${colors.reset}`
    );
    console.log(
      `${colors.green}========================================${colors.reset}`
    );
    console.log(
      `${colors.blue}Subgraph:${colors.reset} ${subgraphName}/${version}`
    );
    console.log(`${colors.blue}Network:${colors.reset} ${network}`);
  } catch (error) {
    console.error(
      `${colors.red}${colors.bright}========================================${colors.reset}`
    );
    console.error(
      `${colors.red}${colors.bright}✗ Deployment failed${colors.reset}`
    );
    console.error(
      `${colors.red}========================================${colors.reset}`
    );
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run deployment
deploy();
