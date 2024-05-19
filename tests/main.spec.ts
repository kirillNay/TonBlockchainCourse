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

    it("Count sum of messages", async () => {
        const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];

        const blockchain = await Blockchain.create();

        const contract = blockchain.openContract(
            MainContract.createFromConfig({}, codeCell)
        )

        const senderWallet = await blockchain.treasury("sender");

        const sendMessage1Result = await contract.sendInternalMessage(senderWallet.getSender(), toNano("0.05"), 20);
        expect(sendMessage1Result.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: contract.address,
            success: true
        });

        const sendMessage2Result = await contract.sendInternalMessage(senderWallet.getSender(), toNano("0.1"), 30);
        expect(sendMessage2Result.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: contract.address,
            success: true
        });

        const sum = await contract.getSum();
        expect(sum).toBe(50);
    });
});