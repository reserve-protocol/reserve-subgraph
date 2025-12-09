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
const versionIndex = args.indexOf("--version");

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

const networks = ["mainnet", "base", "arbitrum-one"];
const results = [];

// Display deployment information
console.log(
  `${colors.cyan}${colors.bright}========================================${colors.reset}`
);
console.log(
  `${colors.blue}${colors.bright}Deploying to All Networks${colors.reset}`
);
console.log(
  `${colors.cyan}========================================${colors.reset}`
);
console.log(`${colors.yellow}Version:${colors.reset} ${version}`);
console.log(`${colors.yellow}Networks:${colors.reset} ${networks.join(", ")}`);
console.log(
  `${colors.cyan}========================================${colors.reset}\n`
);

function deployToNetwork(network) {
  return new Promise((resolve) => {
    console.log(
      `${colors.blue}${colors.bright}Deploying to ${network}...${colors.reset}`
    );
    console.log(
      `${colors.cyan}----------------------------------------${colors.reset}`
    );

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
        results.push({ network, status: "success" });
        console.log(
          `${colors.green}✓ ${network} deployment completed${colors.reset}\n`
        );
      } else {
        results.push({ network, status: "failed" });
        console.log(
          `${colors.red}✗ ${network} deployment failed${colors.reset}\n`
        );
      }
      resolve();
    });

    child.on("error", (err) => {
      results.push({ network, status: "error", error: err.message });
      console.error(
        `${colors.red}✗ ${network} deployment error: ${err.message}${colors.reset}\n`
      );
      resolve();
    });
  });
}

async function deployAll() {
  const startTime = Date.now();

  // Deploy to each network sequentially
  for (const network of networks) {
    await deployToNetwork(network);
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  // Display summary
  console.log(
    `${colors.cyan}${colors.bright}========================================${colors.reset}`
  );
  console.log(
    `${colors.blue}${colors.bright}Deployment Summary${colors.reset}`
  );
  console.log(
    `${colors.cyan}========================================${colors.reset}`
  );

  let successCount = 0;
  let failedCount = 0;

  results.forEach((result) => {
    const statusColor = result.status === "success" ? colors.green : colors.red;
    const statusSymbol = result.status === "success" ? "✓" : "✗";
    console.log(
      `${statusColor}${statusSymbol} ${result.network}: ${result.status}${colors.reset}`
    );

    if (result.status === "success") {
      successCount++;
    } else {
      failedCount++;
    }
  });

  console.log(
    `${colors.cyan}----------------------------------------${colors.reset}`
  );
  console.log(`${colors.yellow}Total time:${colors.reset} ${duration}s`);
  console.log(`${colors.green}Successful:${colors.reset} ${successCount}`);
  if (failedCount > 0) {
    console.log(`${colors.red}Failed:${colors.reset} ${failedCount}`);
  }
  console.log(
    `${colors.cyan}========================================${colors.reset}`
  );

  // Exit with error if any deployments failed
  if (failedCount > 0) {
    process.exit(1);
  }
}

// Run deployments
deployAll();
