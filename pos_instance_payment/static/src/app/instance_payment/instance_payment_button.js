/** @odoo-module */

import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { Component } from "@odoo/owl";
import { ConnectionLostError } from "@web/core/network/rpc_service";
import { useService } from "@web/core/utils/hooks";
import { OrderReceipt } from "@point_of_sale/app/screens/receipt_screen/receipt/order_receipt";

export class instancePaymentButton extends Component {
    static template = "pos_instance_payment.InstancePaymentButton";
    setup() {
        this.pos = usePos();
        this.hardwareProxy = useService("hardware_proxy");
        this.printer = useService("printer");
    }

    get currentOrder() {
        return this.pos.get_order();
    }

    get instancePaymentLabel() {
        return this.pos.config.instance_payment_label
    }

    get paymentLines() {
        return this.currentOrder.get_paymentlines();
    }

    shouldDownloadInvoice() {
        return true;
    }

    get nextScreen() {
        return !this.error ? "ReceiptScreen" : "ProductScreen";
    }

    async click() {
        var enable_instance_payment = this.pos.config.enable_instance_payment;

        var defaultPartner = this.pos.config.default_pos_partner_id[0];
        var partner = this.pos.db.get_partner_by_id(defaultPartner);

        var paymentMethod = this.pos.payment_methods.filter((method) =>
            this.pos.config.default_payment_method_id.includes(method.id)
        );

        if (this.currentOrder && enable_instance_payment) {
            this.currentOrder.set_partner(partner);
            this.currentOrder.add_paymentline(paymentMethod[0]);
            for (const line of this.currentOrder.get_paymentlines()) {
                if (!line.is_done()) {
                    this.currentOrder.remove_paymentline(line);
                }
            }
            await this._finalizeValidation();
        }
    }

    async _finalizeValidation() {
        if (this.currentOrder.is_paid_with_cash() || this.currentOrder.get_change()) {
            this.hardwareProxy.openCashbox();
        }

        this.currentOrder.date_order = luxon.DateTime.now();
        for (const line of this.paymentLines) {
            if (!line.amount === 0) {
                this.currentOrder.remove_paymentline(line);
            }
        }
        this.currentOrder.finalized = true;

        this.env.services.ui.block();
        let syncOrderResult;
        try {
            // 1. Save order to server.
            syncOrderResult = await this.pos.push_single_order(this.currentOrder);
            if (!syncOrderResult) {
                return;
            }
            // 2. Invoice.
            if (this.shouldDownloadInvoice() && this.currentOrder.is_to_invoice()) {
                if (syncOrderResult[0]?.account_move) {
                    await this.report.doAction("account.account_invoices", [
                        syncOrderResult[0].account_move,
                    ]);
                } else {
                    throw {
                        code: 401,
                        message: "Backend Invoice",
                        data: { order: this.currentOrder },
                    };
                }
            }
        } catch (error) {
            if (error instanceof ConnectionLostError) {
                this.pos.showScreen(this.nextScreen);
                Promise.reject(error);
                return error;
            } else {
                throw error;
            }
        } finally {
            this.env.services.ui.unblock();
        }

        // 3. Post process.
        if (
            syncOrderResult &&
            syncOrderResult.length > 0 &&
            this.currentOrder.wait_for_push_order()
        ) {
            await this.postPushOrderResolve(syncOrderResult.map((res) => res.id));
        }

        await this.afterOrderValidation(!!syncOrderResult && syncOrderResult.length > 0);
    }

    async postPushOrderResolve(ordersServerId) {
        const postPushResult = await this._postPushOrderResolve(this.currentOrder, ordersServerId);
        if (!postPushResult) {
            this.popup.add(ErrorPopup, {
                title: _t("Error: no internet connection."),
                body: _t("Some, if not all, post-processing after syncing order failed."),
            });
        }
    }

    async afterOrderValidation(suggestToSync = true) {
        // Remove the order from the local storage so that when we refresh the page, the order
        // won't be there
        this.pos.db.remove_unpaid_order(this.currentOrder);

        // Ask the user to sync the remaining unsynced orders.
        if (suggestToSync && this.pos.db.get_orders().length) {
            const { confirmed } = await this.popup.add(ConfirmPopup, {
                title: _t("Remaining unsynced orders"),
                body: _t("There are unsynced orders. Do you want to sync these orders?"),
            });
            if (confirmed) {
                // NOTE: Not yet sure if this should be awaited or not.
                // If awaited, some operations like changing screen
                // might not work.
                this.pos.push_orders();
            }
        }
        // Always show the next screen regardless of error since pos has to
        // continue working even offline.
        let nextScreen = this.nextScreen;

        if (
            nextScreen === "ReceiptScreen" &&
            !this.currentOrder._printed &&
            this.pos.config.iface_print_auto
        ) {
            const invoiced_finalized = this.currentOrder.is_to_invoice()
                ? this.currentOrder.finalized
                : true;

            if (invoiced_finalized) {
                const printResult = await this.printer.print(
                    OrderReceipt,
                    {
                        data: this.pos.get_order().export_for_printing(),
                        formatCurrency: this.env.utils.formatCurrency,
                    },
                    { webPrintFallback: true }
                );

                if (printResult && this.pos.config.iface_print_skip_screen) {
                    this.pos.removeOrder(this.currentOrder);
                    this.pos.add_new_order();
                    nextScreen = "ProductScreen";
                }
            }
        }

        await this.printReceipt();
        this.pos.removeOrder(this.currentOrder);
        this.pos.add_new_order();

    }

    async _postPushOrderResolve(order, order_server_ids) {
        return true;
    }

    async printReceipt() {
        const isPrinted = await this.printer.print(
            OrderReceipt,
            {
                data: {
                    ...this.currentOrder.export_for_printing(),
                    isBill: this.isBill,
                },
                formatCurrency: this.env.utils.formatCurrency,
            },
            { webPrintFallback: true }
        );

        if (isPrinted) {
            this.currentOrder._printed = true;
        }

    }

}

ProductScreen.addControlButton({
    component: instancePaymentButton,
    condition: function () {
        return this.pos.config.enable_instance_payment
    },
});