import { Address, Cell, Contract, ContractProvider, SendMode, Sender, beginCell, contractAddress } from "ton-core";

export class MainContract implements Contract {

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell, data: Cell }
    ) {

    }

    static createFromConfig(config: any, code: Cell, workchain = 0) {
        const data = beginCell().endCell();
        const init = { code, data };
        const address = contractAddress(workchain, init);

        return new MainContract(address, init);
    }

    async sendInternalMessage(
        provider: ContractProvider,
        sender: Sender,
        value: bigint,
        storeValue: number
    ) {
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(storeValue, 32).endCell()
        })
    }

    async getData(provider: ContractProvider) {
        const { stack } = await provider.get("get_the_latest_sender", []);
        return {
            recent_sender: stack.readAddress(),
        };
    }

    async getSum(provider: ContractProvider) {
        const { stack } = await provider.get("get_sum", []);
        console.log(stack);
        return stack.readNumber()
    }

}