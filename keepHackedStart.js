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
		await ns.scp('justhack.js', 'home', ns.getHostname());
	}
	var hackram = ns.getScriptRam('justhack.js', 'home'); 
	var avsram = (ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname())) * (percent / 100);
	var hsThreads = Math.round((avsram / hackram) / iterations);
	var nthreads2h = Math.ceil((.5/ns.hackAnalyze(serverName)));
	
	if (hsThreads < 1) {
		nthreads2h = 1;
		hsThreads = 1;
		iterations = Math.floor((avsram / hackram));
	}
	var hackTime = ns.getHackTime(serverName);
	var weakenTime = ns.getWeakenTime(serverName);
	await ns.sleep(weakenTime - hackTime);
	while (true) {
		hackTime = ns.getHackTime(serverName);
		for (var i = 0; i < iterations; i++) {
			ns.run('justhack.js', (hsThreads > nthreads2h ? nthreads2h : hsThreads), serverName, i);
			await ns.sleep(Math.ceil(hackTime / iterations));
		}
		await ns.sleep(100);
	}
}