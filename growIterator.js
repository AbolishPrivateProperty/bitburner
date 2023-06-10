/** @param {NS} ns **/
export async function main(ns) {
	var serverName = "max-hardware";
	if (ns.args.length > 0) {
		serverName = ns.args[0];
	}
	var iterations = 100;
	if (ns.args.length > 1) {
		iterations = ns.args[1];
	}
	var percent = 100;
	if (ns.args.length > 2) {
		percent = ns.args[2];
	}
	if (ns.getHostname() != 'home') {
		await ns.scp('grow.js', 'home', ns.getHostname());
	}
    var growram = ns.getScriptRam('grow.js', 'home');  
	var avsram = (ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname())) * (percent / 100);
	ns.print((avsram / growram) + " / 60");
	var gsThreads = Math.round((avsram / growram) / iterations);
	
	if (gsThreads < 1) {
		gsThreads = 1;
		iterations = Math.round((avsram / growram));
	}
	var growTime = ns.getGrowTime(serverName);
	var weakenTime = ns.getWeakenTime(serverName);
	await ns.sleep(weakenTime - growTime);
	while (true) {
		let securityDeficit = ns.getServerSecurityLevel(serverName) - ns.getServerMinSecurityLevel(serverName);
		if (securityDeficit < 5) {
			growTime = ns.getGrowTime(serverName);
			if (gsThreads > 500) {
				iterations = Math.round((avsram / growram) / 500);
				gsThreads = Math.round((avsram / growram) / iterations);
			}
			for (var i = 0; i < iterations; i++) {
				ns.run('grow.js', gsThreads, serverName, i);
				await ns.sleep(Math.ceil(growTime / iterations));
			}
		}
		await ns.sleep(10000);
	}
}