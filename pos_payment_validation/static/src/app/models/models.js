/** @odoo-module */

import { Order, Orderline, Payment } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { _t } from "@web/core/l10n/translation";

patch(Order.prototype, {
  async pay() {
    var qty_restriction = this.pos.config.qty_restriction;
    var qty_limit_count = this.pos.config.qty_limit_count;
    var lines = this.get_orderlines();
    var productIds = [];
    for (const line of lines) {
      productIds.push(line.product.id);
    }
    if (qty_restriction) {
      const productInfo = await this.env.services.orm.call(
        "product.product",
        "get_product_availability_info",
        [productIds, qty_limit_count]
      );
      if (productInfo && productInfo.length) {
        this.env.services.popup.add(ErrorPopup, {
          title: _t("This product under of the Re-Order Point measure"),
          body: productInfo,
        });
      } else {
        return super.pay(...arguments);
      }
    }
  },
});
