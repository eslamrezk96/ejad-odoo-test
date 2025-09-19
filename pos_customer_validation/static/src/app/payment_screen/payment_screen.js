/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { _t } from "@web/core/l10n/translation";

patch(PaymentScreen.prototype, {
  addNewPaymentLine(paymentMethod) {
    var customer_restriction = this.pos.config.customer_restriction;
    if (customer_restriction) {
      var customer = this.pos.get_order().get_partner();
      if (!customer) {
        this.env.services.popup.add(ErrorPopup, {
          title: _t("Customer Required"),
          body: _t("Please select customer to proceed payment"),
        });
      } else if (customer && (!customer.phone || !customer.phone.startsWith("+2"))) {
        this.env.services.popup.add(ErrorPopup, {
          title: _t("Invalid Customer Phone"),
          body: _t("Customer phone must start with +2"),
        });
      } else {
        super.addNewPaymentLine(...arguments);
      }
    } else {
      super.addNewPaymentLine(...arguments);
    }
  },
});
