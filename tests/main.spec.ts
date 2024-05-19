import { Cell, toNano } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";

import "@ton-community/test-utils"

describe("main.fc contract test", () => {
    it("should successfuly increase counter in contract", async () => {
        const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];

        const blockchain = await Blockchain.create();

        const initAddress = await blockchain.treasury("initAddress");

        const contract = blockchain.openContract(
            MainContract.createFromConfig({
                number: 0,
                address: initAddress.address
            }, codeCell)
        );

        const senderWallet = await blockchain.treasury("sender");

        const sendMessageResult = await contract.sendIncrement(senderWallet.getSender(), toNano("0.05"), 20);
        expect(sendMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: contract.address,
            success: true
        });

        const getDataResult = await contract.getData();
        expect(getDataResult.address.toString()).toBe(senderWallet.address.toString());
        expect(getDataResult.number).toBe(20);
    });
});