/** @param {NS} ns **/
export async function main(ns) {
	let ram = ns.args[0];
	let hn = 'hack-';
	let purchasedServers = ns.getPurchasedServers();

	for (let i = 0; i < purchasedServers.length; i++) {
		if (ns.getServerMaxRam(purchasedServers[i]) < ram) {
			ns.killall(purchasedServers[i]);
			ns.deleteServer(purchasedServers[i]);
			await ns.sleep(100);
		}
	}

	for (let i = 0; i < 25; i++) {
		if (!ns.serverExists(hn + i)) {
			ns.purchaseServer(hn + i, ram);
			await ns.sleep(100);
		}
	}
}