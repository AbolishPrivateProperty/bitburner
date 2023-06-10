/** @param {NS} ns **/
export async function main(ns) {
    if (ns.args.length > 2) {
        var waitAgain = false;
        await ns.sleep(ns.args[2]);
        while (true) {
            let moneyDeficit = await ns.read('moneyDeficit.txt');
            let securityDeficit = await ns.read('securityDeficit.txt');
            while (moneyDeficit > 5 || securityDeficit > 1) {
                await ns.sleep(100);
                moneyDeficit = await ns.read('moneyDeficit.txt');
                securityDeficit = await ns.read('securityDeficit.txt');
                waitAgain = true;
            }
            if (waitAgain) {
                await ns.sleep(ns.args[2]);
                waitAgain = false;
            }
            await ns.hack(ns.args[0]);
            await ns.sleep(10);
        }
    } else {
        await ns.hack(ns.args[0]);
    }
}