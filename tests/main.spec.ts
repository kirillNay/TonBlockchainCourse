import { Cell, toNano } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";

import "@ton-community/test-utils"

describe("main.fc contract test", () => {

    let blockchain: Blockchain;
    let contract: SandboxContract<MainContract>;
    let initWallet: SandboxContract<TreasuryContract>;
    let ownerWallet: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];

        blockchain = await Blockchain.create();

        initWallet = await blockchain.treasury("initWallet");
        ownerWallet = await blockchain.treasury("ownerWallet");

        contract = blockchain.openContract(
            MainContract.createFromConfig({
                number: 0,
                address: initWallet.address,
                owner_address: ownerWallet.address
            }, codeCell)
        );
    });

    it("should successfuly increase counter in contract", async () => {
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

    it("successfuly deposit funds", async () => {
        const senderWallet = await blockchain.treasury("senderWallet");
        const depositMessageResult = await contract.sendDeposit(senderWallet.getSender(), toNano("5"));

        expect(depositMessageResult.transactions).toHaveTransaction( {
            from: senderWallet.address,
            to: contract.address,
            success: true
        });

        const balanceRequest = await contract.getBalance();

        expect(balanceRequest.balance).toBeGreaterThan(toNano("4.99"));
    });

    it("should return deposit funds as no comment is sent", async () => {
        const senderWallet = await blockchain.treasury("senderWallet");
        const depositMessageResult = await contract.sendNoCodeDeposit(senderWallet.getSender(), toNano("5"));

        expect(depositMessageResult.transactions).toHaveTransaction( {
            from: senderWallet.address,
            to: contract.address,
            success: false
        });

        const balanceRequest = await contract.getBalance();

        expect(balanceRequest.balance).toBe(0);
    });

    it("successfuly withdraw funds on behalf of owner", async () => {
        const senderWallet = await blockchain.treasury("senderWallet");

        await contract.sendDeposit(senderWallet.getSender(), toNano("5"));

        const withdrawalRequest = await contract.sendWithdrawalRequest(
            ownerWallet.getSender(),
            toNano("0.05"),
            toNano(1)
        );

        expect(withdrawalRequest.transactions).toHaveTransaction({
            from: ownerWallet.address,
            to: contract.address,
            success: true,
            value: toNano("0.05")
        })

        expect(withdrawalRequest.transactions).toHaveTransaction({
            from: contract.address,
            to: ownerWallet.address,
            success: true,
            value: toNano(1)
        })
    });

    it("fails to withdraw funds on behalf of non owner", async () => {
        const senderWallet = await blockchain.treasury("senderWallet");

        await contract.sendDeposit(senderWallet.getSender(), toNano("5"));

        const withdrawalRequest = await contract.sendWithdrawalRequest(
            senderWallet.getSender(),
            toNano("0.05"),
            toNano(1)
        );

        expect(withdrawalRequest.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: contract.address,
            success: false,
            exitCode: 103
        })
    });

    it("fails to withdraw funds because lack of balance", async () => {
        const withdrawalRequest = await contract.sendWithdrawalRequest(
            ownerWallet.getSender(), 
            toNano("0.05"),
            toNano(1)
        )

        expect(withdrawalRequest.transactions).toHaveTransaction( {
           from: ownerWallet.address,
           to: contract.address,
           value: toNano("0.05"),
           success: false,
           exitCode: 104 
        } )
        
    });


});