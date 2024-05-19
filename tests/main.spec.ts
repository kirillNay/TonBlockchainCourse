import { Cell, toNano } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";

import "@ton-community/test-utils"

describe("main.fc contract test", () => {
    it("Gets proper latest address", async () => {
        const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];

        const blockchain = await Blockchain.create();

        const contract = blockchain.openContract(
            MainContract.createFromConfig({}, codeCell)
        );

        const senderWallet = await blockchain.treasury("sender");

        const sendMessageResult = await contract.sendInternalMessage(senderWallet.getSender(), toNano("0.05"), 20);
        expect(sendMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: contract.address,
            success: true
        });

        const getDataResult = await contract.getData();
        expect(getDataResult.recent_sender.toString()).toBe(senderWallet.address.toString());
    });
});