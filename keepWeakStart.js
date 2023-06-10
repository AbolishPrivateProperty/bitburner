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
		await ns.scp('weaken.ns', 'home', ns.getHostname());
	}
	await ns.sleep(200);
    var weakenram = ns.getScriptRam('weaken.ns', 'home');  
	var avsram = (ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname())) * (percent / 100);
	var wsThreads = Math.floor((avsram / weakenram) / iterations);
	
	if (wsThreads < 1) {
		wsThreads = 1;
		iterations = Math.floor((avsram / weakenram));
	}
	while (true) {
		var weakenTime = ns.getWeakenTime(serverName);
		for (var i = 0; i < iterations; i++) {
			ns.run('weaken.ns', wsThreads, serverName, i);
			await ns.sleep(Math.ceil(weakenTime / iterations));
		}
		await ns.sleep(1000);
	}
}