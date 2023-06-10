/** @param {NS} ns **/
export async function main(ns) {
    if (ns.args.length > 2) {
        var waitAgain = false;
        await ns.sleep(ns.args[2]);
        while (true) {
            let securityDeficit = await ns.read('securityDeficit.txt');
            while (securityDeficit > 1) {
                await ns.sleep(100);
                securityDeficit = await ns.read('securityDeficit.txt');
                waitAgain = true;
            }
            if (waitAgain) {
                await ns.sleep(ns.args[2]);
                waitAgain = false;
            }
            await ns.grow(ns.args[0]);
            await ns.sleep(10);
        }
    } else {
        await ns.grow(ns.args[0]);
    }
}