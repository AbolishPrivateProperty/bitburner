```
/** @param {NS} ns **/
export async function main(ns) {
	var maxMoneyServer = await iterateServers('home', 'home', ['home']);
	ns.tprint('Best Server: ' + maxMoneyServer);
	ns.tprint('Max Money: ' + ns.getServerMaxMoney(maxMoneyServer));
	ns.tprint('Min Security: ' + ns.getServerMinSecurityLevel(maxMoneyServer));
	ns.tprint('Required Hacking Level: ' + ns.getServerRequiredHackingLevel(maxMoneyServer));

	async function iterateServers(currentServer, maxMoneyServer, allServers) {
		var scanServers = ns.scan(currentServer);
		for (var i = 0; i < scanServers.length; i++) {
			if (!allServers.includes(scanServers[i])) {
				allServers.push(scanServers[i]);
				if (ns.getServerMaxMoney(scanServers[i]) > ns.getServerMaxMoney(maxMoneyServer) && 
					await attack(scanServers[i])
				) {
					maxMoneyServer = scanServers[i];
				}
				var childMaxMoneyServer = await iterateServers(scanServers[i], maxMoneyServer, allServers);
				if (ns.getServerMaxMoney(childMaxMoneyServer) > ns.getServerMaxMoney(maxMoneyServer)) {
					maxMoneyServer = childMaxMoneyServer;
				}
			}
		}

		return maxMoneyServer;
	}
	
	async function attack(server) {
		var hacktoolnum = 0;
		if (!ns.hasRootAccess(server)) {
			ns.toast('Opening ports on ' + server);
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
}
```