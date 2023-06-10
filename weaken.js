/** @param {NS} ns **/
export async function main(ns) {
    if (ns.args.length > 2) {
        await ns.sleep(ns.args[2]);
        while (true) {
            await ns.weaken(ns.args[0]);
            await ns.sleep(10);
        }
    } else {
        await ns.weaken(ns.args[0]);
    }
}