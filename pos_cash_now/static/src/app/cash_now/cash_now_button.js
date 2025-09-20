/** @odoo-module */

import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { Order } from "@point_of_sale/app/store/models";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { Component } from "@odoo/owl";

export class cashNowButton extends Component {
    static template = "pos_cash_now.CashNowButton";
    setup() {
        this.pos = usePos();
    }
    async click() {
        var currentOrder = this.pos.get_order();
        var enable_cash_now = this.pos.config.enable_cash_now;

        var defaultPartner = this.pos.config.default_pos_partner_id[0];
        var partner = this.pos.db.get_partner_by_id(defaultPartner);

        var paymentMethod = this.pos.payment_methods.filter((method) =>
            this.pos.config.default_payment_method_id.includes(method.id)
        );

        if (currentOrder && enable_cash_now) {
            currentOrder.set_partner(partner);
            currentOrder.add_paymentline(paymentMethod);
        }
    }
}

ProductScreen.addControlButton({ component: cashNowButton });
