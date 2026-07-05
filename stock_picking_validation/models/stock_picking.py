# -*- coding: utf-8 -*-

from odoo import fields, models, api
from odoo.exceptions import ValidationError


class Picking(models.Model):
    _inherit = 'stock.picking'

    def button_validate(self):
        for picking in self:
            if picking.picking_type_code == 'outgoing':
                if picking.scheduled_date.date() < fields.Date.today():
                    raise ValidationError("You cannot validate an outgoing picking with a scheduled date earlier than today.")
        return super(Picking, self).button_validate()

    @api.model_create_multi
    def create(self, vals_list):
        pickings = super(Picking, self).create(vals_list)
        for picking in pickings:
            if picking.picking_type_code == 'outgoing':
                if picking.scheduled_date.date() < fields.Date.today():
                    raise ValidationError("You cannot create an outgoing picking with a scheduled date earlier than today.")
        return pickings

    @api.constrains('scheduled_date', 'picking_type_code')
    def _check_schedule_date(self):
        for picking in self:
            if picking.picking_type_code == 'outgoing':
                if picking.scheduled_date.date() < fields.Date.today():
                    raise ValidationError("You cannot set a scheduled date earlier than today for an outgoing picking.")