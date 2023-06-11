/** @param {NS} ns **/
export async function main(ns) {
	const requiredFiles = {
		singularity: {
			file: 'singularityTools.js',
			url: 'https://raw.githubusercontent.com/AbolishPrivateProperty/bitburner/main/singularityTools.js',
		},
		purchase: {
			file: 'purchaseServers.js',
			url: 'https://raw.githubusercontent.com/AbolishPrivateProperty/bitburner/main/purchaseServers.js',
		},
		weakenIterator: {
			file: 'weakenIterator.js',
			url: 'https://raw.githubusercontent.com/AbolishPrivateProperty/bitburner/main/weakenIterator.js',
		},
		weaken: {
			file: 'weaken.js',
			url: 'https://raw.githubusercontent.com/AbolishPrivateProperty/bitburner/main/weaken.js',
		},
		hackIterator: {
			file: 'hackIterator.js',
			url: 'https://raw.githubusercontent.com/AbolishPrivateProperty/bitburner/main/hackIterator.js',
		},
		hack: {
			file: 'justhack.js',
			url: 'https://raw.githubusercontent.com/AbolishPrivateProperty/bitburner/main/justhack.js',
		},
		growIterator: {
			file: 'growIterator.js',
			url: 'https://raw.githubusercontent.com/AbolishPrivateProperty/bitburner/main/growIterator.js',
		},
		grow: {
			file: 'grow.js',
			url: 'https://raw.githubusercontent.com/AbolishPrivateProperty/bitburner/main/grow.js',
		},
	};

	const weakenValues = {
		'weaken': {
			"percent": 99,
			"threads": 1,
		}
	};
	const growValues = {
		'grow': {
			"percent": 70,
			"threads": 64,
		},
		'weaken': {
			"percent": 30,
			"threads": 80,
		},
	};
	const hackValues = {
		'hack': {
			"percent": 10,
			"threads": 20,
		},
		'grow': {
			"percent": 75,
			"threads": 64,
		},
		'weaken': {
			"percent": 15,
			"threads": 160,
		},
	};
	var profitDelay = 60 * 60; // Wait an hour after starting to hack a server before moving on

	const suppressLogs = [
		'disableLog',
		'sleep',
		'kill',
		'fileExists',
		'scp',
		'getServerMaxMoney',
		'getServerMoneyAvailable',
		'getServerMinSecurityLevel',
		'getServerSecurityLevel',
		'exec',
		'scan',
		'getServerMaxRam',
		'getHackingLevel',
		'getServerRequiredHackingLevel',
		'killall',
		'purchaseServer',
		'deleteServer',
		'brutessh',
		'getServerNumPortsRequired',
		'ftpcrack',
		'nuke',
		'relaysmtp',
		'httpworm',
		'sqlinject',
		'getServerUsedRam',
	];

	for (let i = 0; i < suppressLogs.length; i++) {
		ns.disableLog(suppressLogs[i]);
		await ns.sleep(5);
	}
	
	for (const file of Object.values(requiredFiles)) {
		if (!ns.fileExists(file.file)) {
			await fetchFile(file.file, file.url);
		}
		await ns.sleep(5);
	}
	
	var purchasedServerSize = 64;
	var allServers = [];
	var wormServers = [];

	var targetServer = "silver-helix";
	if (ns.args.length > 0) {
		targetServer = ns.args[0];
	} else {
		targetServer = await iterateServers('home', 'home', ['home']);
	}

    var currentServer = '';
	var profitStart = 0;
	var finishTime = 0;
	var lastServerLookup = 0;
	var purchaseDelay = Math.floor(Date.now() / 1000) + 60;
	while (true) {
		// Only actually go through this process with "new" servers
		if (currentServer != targetServer &&
			profitStart <= Math.floor(Date.now() / 1000) // Wait until the profit delay before switching servers
		) {
			if (profitStart != 0) {
				profitStart = 0;
			}

			allServers = ['home'];
			wormServers = await getPurchasedServersAlt();
			wormServers.push('home');
			await fetchServersUpdated("home");
			currentServer = targetServer;
			finishTime = Math.floor(Date.now() / 1000) + (ns.getWeakenTime(currentServer) / 1000);
			await showServerInfo(currentServer, 'weaken');
			if (await attack(targetServer) && ns.getServerMaxMoney(targetServer) > 0) { 
				profitDelay = await getProfitDelay(); // Override the default profit delay, get based on how long it takes to hack instead
				finishTime = Math.floor(Date.now() / 1000) + (ns.getWeakenTime(currentServer) / 1000);
				await fullyWeaken();
				await fullyGrow();
				await setHackPercents();
				// Finally hack this shit
				for (var d = 0; d < wormServers.length; d++) {
					await keepHacked(wormServers[d], d);
					await ns.sleep(5);
				}
			} else {
				ns.tprint("Unable to target the selected server: " + targetServer);
			}
		}
		if (profitStart == 0 &&
			ns.isRunning(requiredFiles.hack.file, 'home', currentServer, 0)
		) {
			// Calculate the profit start after the first instance of the simple hack is running locally.
			profitStart = Math.floor((Date.now() / 1000) + profitDelay);
		}
		if (profitStart != 0 &&
			profitStart <= Math.floor(Date.now() / 1000) &&
			(Math.floor(Date.now() / 1000) - lastServerLookup) > 60
		) {
			targetServer = await iterateServers('home', 'home', ['home']);
			lastServerLookup = Math.floor(Date.now() / 1000);
		}
		// if (ns.getUpgradeHomeRamCost() * 2 < ns.getServerMoneyAvailable('home')) {
		// 	ns.upgradeHomeRam();
		// 	await keepHacked('home');
		// }
		await ns.sleep(1000);
		await showServerInfo(currentServer);
		if (Math.floor(Date.now() / 1000) > purchaseDelay) {
			purchaseDelay = Math.floor(Date.now() / 1000) + 60;
			await purchaseServers();
		}
	}
	
	async function fullyWeaken() {
		var securityDeficit = ns.getServerSecurityLevel(targetServer) - ns.getServerMinSecurityLevel(targetServer);
		if (securityDeficit > 5) {
			finishTime = Math.floor(Date.now() / 1000) + (ns.getWeakenTime(targetServer) / 1000);
			for (var i = 0; i < wormServers.length; i++) {
				await keepWeak(wormServers[i]);
				await ns.sleep(5);
			}
			while (securityDeficit > 0) { 
				// Keep weakening with entire home server until the target is at minimum security, then move on
				await ns.sleep(1000);
				securityDeficit = ns.getServerSecurityLevel(targetServer) - ns.getServerMinSecurityLevel(targetServer);
				await showServerInfo(targetServer, 'weaken');
			}
		}
	}

	async function fullyGrow() {
		var moneyDeficit = ns.getServerMaxMoney(targetServer) - ns.getServerMoneyAvailable(targetServer);
		if (moneyDeficit > (ns.getServerMaxMoney(targetServer) * 0.05)) {
			finishTime = Math.floor(Date.now() / 1000) + (ns.getWeakenTime(targetServer) / 1000);
			for (var i = 0; i < wormServers.length; i++) {
				await keepGrown(wormServers[i]);
				await ns.sleep(5);
			}
			while (moneyDeficit > 0) { 
				// Keep growing and weakening with every other hack server until the target is at max money, then move on
				await ns.sleep(1000);
				moneyDeficit = ns.getServerMaxMoney(targetServer) - ns.getServerMoneyAvailable(targetServer);
				await showServerInfo(targetServer, 'grow');
			}
		}
	}

	async function killEverything(server) {
		if (server == "home") {
			let runningScripts = ns.ps('home');
			for (let a = 0; a < runningScripts.length; a++) {
				if (runningScripts[a].filename != ns.getScriptName() &&
					runningScripts[a].filename != 'buyMoney.js' &&
					runningScripts[a].filename != 'autocontracts.js'
				) {
					 ns.kill(runningScripts[a].pid, 'home');
				}
				await ns.sleep(5);
			}
		} else {
			ns.killall(server);
		}
	}

	async function keepHacked(server, counter) {
		await ns.scp(
			[
				requiredFiles.hackIterator.file, 
				requiredFiles.hack.file, 
				requiredFiles.weakenIterator.file, 
				requiredFiles.weaken.file, 
				requiredFiles.growIterator.file, 
				requiredFiles.grow.file
			], 
			server,
			"home"
		);
		await killEverything(server);
		await ns.sleep(5);
		if (!ns.scriptRunning(requiredFiles.hackIterator.file, server)) {
			await ns.sleep(10);
			let tmpCounter = counter;
			if (server == 'home') {
				tmpCounter = 1;
			}
			await execScript(requiredFiles.weakenIterator.file, server, 1, [targetServer, hackValues.weaken.threads, hackValues.weaken.percent, tmpCounter]);
			await execScript(requiredFiles.growIterator.file, server, 1, [targetServer, hackValues.grow.threads, hackValues.grow.percent, tmpCounter]);
			await execScript(requiredFiles.hackIterator.file, server, 1, [targetServer, hackValues.hack.threads, hackValues.hack.percent, tmpCounter]);
		}
	}

	async function keepWeak(server) {
		await ns.scp([requiredFiles.weakenIterator.file, requiredFiles.weaken.file], server, "home");
		await killEverything(server);
		await ns.sleep(5);
		if (!ns.scriptRunning(requiredFiles.weakenIterator.file, server)) {
			await ns.sleep(5);
			await execScript(requiredFiles.weakenIterator.file, server, 1, [targetServer, weakenValues.weaken.threads, weakenValues.weaken.percent]);
		}
	}

	async function keepGrown(server) {
		await ns.scp([requiredFiles.weakenIterator.file, requiredFiles.weaken.file, requiredFiles.growIterator.file, requiredFiles.grow.file], server, "home");
		await killEverything(server);
		await ns.sleep(5);
		if (!ns.scriptRunning(requiredFiles.growIterator.file, server)) {
			await ns.sleep(5);
			await execScript(requiredFiles.weakenIterator.file, server, 1, [targetServer, growValues.weaken.threads, growValues.weaken.percent]);
			await execScript('growIterator.js', server, 1, [targetServer, growValues.grow.threads, growValues.grow.percent]);
		}
	}
	
	async function attack(server) {
		var hacktoolnum = 0;
		if (!ns.hasRootAccess(server)) {
			ns.toast('Opening ports on ' + server);
			
			if (!ns.fileExists('BruteSSH.exe', 'home') ||
				!ns.fileExists('FTPCrack.exe', 'home') ||
				!ns.fileExists('relaySMTP.exe', 'home') ||
				!ns.fileExists('HTTPWorm.exe', 'home') ||
				!ns.fileExists('SQLInject.exe', 'home') ||
				!ns.fileExists('DeepscanV1.exe', 'home') ||
				!ns.fileExists('DeepscanV2.exe', 'home') // only run this if we actually need one of the tools.
			) {
				await execScript(requiredFiles.singularity.file, 'home', 1, [], true);
			}

			if (ns.fileExists('BruteSSH.exe', 'home')) {
				ns.brutessh(server);
				hacktoolnum++;
			}

			if (ns.fileExists('FTPCrack.exe', 'home')) {
				ns.ftpcrack(server);
				hacktoolnum++;
			}

			if (ns.fileExists('relaySMTP.exe', 'home')) {
				ns.relaysmtp(server);
				hacktoolnum++;
			}

			if (ns.fileExists('HTTPWorm.exe', 'home')) {
				ns.httpworm(server);
				hacktoolnum++;
			}

			if (ns.fileExists('SQLInject.exe', 'home')) {
				ns.sqlinject(server);
				hacktoolnum++;
			}

			if (ns.getServerNumPortsRequired(server) <= hacktoolnum) {
				ns.toast("nuking " + server);
				ns.nuke(server);
			}
			if (!ns.hasRootAccess(server)) {
				ns.toast("unable to gain root to " + server, "error");
			}
		}
		
		return ns.hasRootAccess(server);
	}

	async function padLeadingZeros(num, size) {
		let s = num + "";
		while (s.length < size) {
			s = "0" + s;
		}
		
		return s;
	}
	
	async function fetchServersUpdated(host) {
		var tmpServers = ns.scan(host);
		for (var i = 0; i < tmpServers.length; i++) {
			if (!allServers.includes(tmpServers[i])) {
				if (!wormServers.includes(tmpServers[i]) &&
					ns.getServerMaxRam(tmpServers[i]) > 32 &&
					await attack(tmpServers[i])
				) {
					wormServers.push(tmpServers[i]);
				}
				if (!allServers.includes(tmpServers[i])) {
					allServers.push(tmpServers[i]);
				}
				await fetchServersUpdated(tmpServers[i]);
			}
			await ns.sleep(5);
		}
		await ns.sleep(5);
		for (let i = 0; i < wormServers.length; i++) {
			if (wormServers[i].includes('hacknet-node-')) {
				wormServers.splice(i, 1);
			}
		}
	}

	async function showServerInfo(tmpServer, step = 'hack') {
		let now = new Date();
		if (step == 'grow') {
			ns.print("GROWING");
		} else if (step == 'weaken') {
			ns.print("WEAKENING");
		} else {
			ns.print("HACKING!");
		}
		ns.print("Most Profitable Server: " + targetServer);
		ns.print("Target Server: " + tmpServer);
		ns.print("Max Money: $" + ns.getServerMaxMoney(tmpServer).toLocaleString());
		ns.print("Current Money: $" + ns.getServerMoneyAvailable(tmpServer).toLocaleString());
		ns.print("Min Security: " + ns.getServerMinSecurityLevel(tmpServer));
		ns.print("Current Security: " + ns.getServerSecurityLevel(tmpServer));
		ns.print("Time: " + await padLeadingZeros(now.getHours(), 2) + ":" + await padLeadingZeros(now.getMinutes(), 2) + ":" + await padLeadingZeros(now.getSeconds(), 2));
		let finishDelta = Math.floor(finishTime - Math.floor(Date.now() / 1000));
		if (finishDelta > 0) {
			ns.print("First Operation: T-Minus " + finishDelta + " seconds");
		} else {
			let profitDelta = Math.floor(profitStart - Math.floor(Date.now() / 1000));
			if (profitStart > 0) {
				ns.print("Profit Switching: T-Minus " + profitDelta + " seconds");
			} else {
				ns.print("Profit Switching Timer Initializing...");
			}
		}
		ns.print("------------------------------------");
	}

	async function getProfitDelay() {
		return (ns.getWeakenTime(currentServer) + (ns.getHackTime(currentServer) * 100)) / 1000;
		// Wait as long as it takes to weaken the server once, then 50 full hacks, which should be ~1000 actual hacks.
	}

	async function execScript(scriptName, server, threads, args, wait = false) {
		if (ns.getScriptRam(scriptName, server) > (ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) &&
			ns.getServerMaxRam(server) > (ns.getScriptRam(scriptName, server) + ns.getScriptRam(ns.getScriptName(), 'home'))
		) {
			let limit = 60; // seconds we'll wait for memory to free
			let count = 0;
			while (count <= limit && 
				ns.getScriptRam(scriptName, server) > (ns.getServerMaxRam(server) - ns.getServerUsedRam(server))
			) {
				await ns.sleep(1000);
				count++;
			}
		}
		let tmpPID = ns.exec(scriptName, server, threads, ...args);
		if (wait) {
			while (ns.isRunning(tmpPID)) {
				await ns.sleep(100); // we're holding execution until the script finishes
			}
		}
	}
	
	async function getPurchasedServersAlt () {
		let output = [];
		let servers = ns.scan('home');
		for (let i = 0; i < servers.length; i++) {
			let server = servers[i];
			if (server !== 'darkweb' &&
				!server.includes('hacknet-node-') &&
				ns.getServerNumPortsRequired(server) == 5 && 
				ns.getServerRequiredHackingLevel(server) == 1
			) {
				output.push(server);
			}
			await ns.sleep(5);
		}

		return output;
	}

	async function fetchFile(filename, url) {
		var result = '';
		await fetch(url)
			.then(response => response.text())
			.then((data) => {
				result = data;
			});
		await ns.write(filename, result);
		await ns.sleep(5);
	}

	async function purchaseServers() {
		let purchasedServers = await getPurchasedServersAlt();
		purchasedServerSize = (purchasedServers.length > 0 ? ns.getServerMaxRam(purchasedServers[0]) : 32) * 2;
		let serverMoneyAvailablePercent = (ns.getServerMoneyAvailable('home') * 0.01)
		if (purchasedServerSize * 2 <= 131072 &&
			ns.getPurchasedServerCost(purchasedServerSize) < serverMoneyAvailablePercent
		) { // 
			while (purchasedServerSize * 2 <= 131072 &&
				ns.getPurchasedServerCost(purchasedServerSize) < serverMoneyAvailablePercent
			) {
				purchasedServerSize = purchasedServerSize * 2; // Keep increasing the size as long as it's in spec
			}
			await execScript(requiredFiles.purchase.file, 'home', 1, [purchasedServerSize], true);
			if (profitStart != 0) {
				let purchasedServers = await getPurchasedServersAlt();
				for (let a = 0; a < purchasedServers.length; a++) {
					await keepHacked(purchasedServers[a], a);
					await ns.sleep(5);
				}
			}
		}
	}

	async function iterateServers(currentServer, maxMoneyServer, allServers) {
		var scanServers = ns.scan(currentServer);
		for (var i = 0; i < scanServers.length; i++) {
			let scanServer = scanServers[i];
			if (!allServers.includes(scanServer)) {
				allServers.push(scanServer);
				// Determine most profitable server by multiplying the success chance by the max money
				ns.getHackingMultipliers
				let hackingTime = await calculateHackingTime(scanServer);
				//let currentServerMoneyFactor = ns.getServerMaxMoney(scanServer);
				let currentServerMoneyFactor = (ns.getServerMaxMoney(scanServer) * await calculatePercentMoneyHacked(scanServer) * await calculateHackingChance(scanServer)) / hackingTime;
				if (hackingTime < 15) {
					currentServerMoneyFactor *= 0.3;
				} else if (hackingTime < 30) {
					currentServerMoneyFactor *= 0.6;
				}
				//let maxServerMoneyFactor = ns.getServerMaxMoney(maxMoneyServer);
				let maxServerMoneyFactor = (ns.getServerMaxMoney(maxMoneyServer) * await calculatePercentMoneyHacked(maxMoneyServer) * await calculateHackingChance(maxMoneyServer)) / await calculateHackingTime(maxMoneyServer);
				if (currentServerMoneyFactor > maxServerMoneyFactor && 
					ns.getServerRequiredHackingLevel(scanServer) <= ns.getHackingLevel() &&
					await attack(scanServer)
				) {
					maxMoneyServer = scanServer;
				}
				var childMaxMoneyServer = await iterateServers(scanServer, maxMoneyServer, allServers);
				if (ns.getServerMaxMoney(childMaxMoneyServer) > ns.getServerMaxMoney(maxMoneyServer)) {
					maxMoneyServer = childMaxMoneyServer;
				}
			}
		}

		return maxMoneyServer;
	}

	async function setHackPercents() {
		let hackSize = ns.hackAnalyze(targetServer);
		let increaseSize = 1 / (1 - hackSize);
		let hackTime = ns.getHackTime(targetServer);
		let growTime = ns.getGrowTime(targetServer);
		let hackMultiplier = 1 / (hackTime / growTime);
		let growSize = ns.growthAnalyze(targetServer, increaseSize) * 1.3;
		growSize = growSize * hackMultiplier;
		growSize = growSize / (growSize + 1);
		hackSize = (1 - growSize);
		let growPercent = Math.round(80 * (growSize), 2);
		let hackPercent = Math.round(80 * (hackSize), 2);
		if (hackPercent < 5) {
			hackPercent = 2; // sanity limits
			growPercent = 78;
		} else if (growPercent < 5) {
			growPercent = 5;
			hackPercent = 75;
		}
		ns.tprint("growPercent: " + growPercent + '%');
		ns.tprint("hackPercent: " + hackPercent + '%');
		hackValues.grow.percent = growPercent + 5;
		hackValues.hack.percent = hackPercent;
	}

	async function calculateHackingTime(server) {
		const requiredHackingSkill = ns.getServerRequiredHackingLevel(server);
		const hackDifficulty = ns.getServerMinSecurityLevel(server);
		const difficultyMult = requiredHackingSkill * hackDifficulty;
		const hackingSkill = ns.getHackingLevel();
		const hackingMultipliers = ns.getHackingMultipliers();
		const hackingSpeedMultiplier = hackingMultipliers.speed;

		const baseDiff = 500;
		const baseSkill = 50;
		const diffFactor = 2.5;
		let skillFactor = diffFactor * difficultyMult + baseDiff;
		
		skillFactor /= hackingSkill + baseSkill;

		const hackTimeMultiplier = 5;
		const hackingTime = (hackTimeMultiplier * skillFactor) / (hackingSpeedMultiplier);

		return hackingTime;
	}

	async function calculateHackingChance(server) {
		const hackFactor = 1.75;
		const difficultyMult = (100 - ns.getServerMinSecurityLevel(server)) / 100;
		const skillMult = hackFactor * ns.getHackingLevel();
		const skillChance = (skillMult - ns.getServerRequiredHackingLevel(server)) / skillMult;
		const hackingMultipliers = ns.getHackingMultipliers();
		const chance = skillChance * difficultyMult * hackingMultipliers.chance;
		if (chance > 1) {
			return 1;
		}
		if (chance < 0) {
			return 0;
		}

		return chance;
	}

	async function calculatePercentMoneyHacked(server) {
		// Adjust if needed for balancing. This is the divisor for the final calculation
		const balanceFactor = 240;
		const requiredHackingSkill = ns.getServerRequiredHackingLevel(server);
		const hackDifficulty = ns.getServerMinSecurityLevel(server);
		const hackingSkill = ns.getHackingLevel();
		const hackingMultipliers = ns.getHackingMultipliers();
		const serverMaxMoney = ns.getServerMaxMoney(server);

		const difficultyMult = (100 - hackDifficulty) / 100;
		const skillMult = (hackingSkill - (requiredHackingSkill - 1)) / hackingSkill;
		const percentMoneyHacked = (difficultyMult * skillMult * hackingMultipliers.money) / balanceFactor;
		if (percentMoneyHacked < 0) {
			return 0;
		}
		if (percentMoneyHacked > 1) {
			return 1;
		}

		//const BitNodeMultipliers = ns.getBitNodeMultipliers();

		return percentMoneyHacked * serverMaxMoney; //BitNodeMultipliers.ScriptHackMoney;
	}
}