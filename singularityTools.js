/** @param {NS} ns **/
export async function main(ns) {
	ns.purchaseTor();

	if (!ns.fileExists('BruteSSH.exe', 'home')) {
		ns.purchaseProgram('BruteSSH.exe');
	}

	if (!ns.fileExists('FTPCrack.exe', 'home')) {
		ns.purchaseProgram('FTPCrack.exe');
	}
	
	if (!ns.fileExists('relaySMTP.exe', 'home')) {
		ns.purchaseProgram('relaySMTP.exe');
	}
	
	if (!ns.fileExists('HTTPWorm.exe', 'home')) {
		ns.purchaseProgram('HTTPWorm.exe');
	}
	
	if (!ns.fileExists('SQLInject.exe', 'home')) {
		ns.purchaseProgram('SQLInject.exe');
	}
	
	if (!ns.fileExists('DeepscanV1.exe', 'home')) {
		ns.purchaseProgram('DeepscanV1.exe');
	}
	
	if (!ns.fileExists('DeepscanV2.exe', 'home')) {
		ns.purchaseProgram('DeepscanV2.exe');
	}
	
	if (!ns.fileExists('AutoLink.exe', 'home')) {
		ns.purchaseProgram('AutoLink.exe');
	}
}