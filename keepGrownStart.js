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
		await ns.scp('grow.ns', 'home', ns.getHostname());
	}
    var growram = ns.getScriptRam('grow.ns', 'home');  
	var avsram = (ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname())) * (percent / 100);
	ns.print((avsram / growram) + " / 60");
	var gsThreads = Math.round((avsram / growram) / iterations);
	
	if (gsThreads < 1) {
		gsThreads = 1;
		iterations = Math.floor((avsram / growram));
	}
	var growTime = ns.getGrowTime(serverName);
	var weakenTime = ns.getWeakenTime(serverName);
	await ns.sleep(weakenTime - growTime);
	while (true) {
		growTime = ns.getGrowTime(serverName);
		for (var i = 0; i < iterations; i++) {
			ns.run('grow.ns', gsThreads, serverName, i);
			await ns.sleep(Math.ceil(growTime / iterations));
		}
		await ns.sleep(1000);
	}
}