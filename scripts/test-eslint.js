#!/usr/bin/env node

const {execSync} = require('child_process');
const path = require('path');

console.log('🚀 Running ESLint tests...\n');

// Test directories and their configs
const testConfigs = [
	{
		name: 'Main App (Next.js)',
		command: 'npx next lint',
		cwd: process.cwd(),
	},
	{
		name: 'Functions',
		command: 'npx eslint . --ext .ts,.tsx,.js,.jsx',
		cwd: path.join(process.cwd(), 'functions'),
	},
	{
		name: 'Scripts',
		command: 'npx eslint scripts/ --ext .ts,.tsx,.js,.jsx',
		cwd: process.cwd(),
	},
	{
		name: 'CSS Styles',
		command: 'npx stylelint "**/*.css" "**/*.scss" "**/*.sass"',
		cwd: process.cwd(),
	},
];

let allPassed = true;

for (const config of testConfigs) {
	try {
		console.log(`📋 Testing: ${config.name}`);
		console.log(`📂 Directory: ${config.cwd}`);
		console.log(`⚡ Command: ${config.command}\n`);

		execSync(config.command, {
			cwd: config.cwd,
			stdio: 'inherit',
			env: {...process.env, FORCE_COLOR: '1'},
		});

		console.log(`✅ ${config.name} - PASSED\n`);
	} catch (_) {
		console.log(`❌ ${config.name} - FAILED\n`);
		allPassed = false;
	}
}

if (allPassed) {
	console.log('🎉 All ESLint tests passed!');
	process.exit(0);
} else {
	console.log('💥 Some ESLint tests failed!');
	process.exit(1);
}
