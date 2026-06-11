# -*- coding: utf-8 -*-

import logging

from odoo import api, fields, models

_logger = logging.getLogger(__name__)


class ProjectProject(models.Model):
    _inherit = "project.project"

    x_kanban_total_boq = fields.Float(
        string="Kanban Total BOQ",
        group_operator=False,
    )
    x_kanban_delivered = fields.Float(
        string="Kanban Delivered",
        group_operator=False,
    )
    x_kanban_remaining = fields.Float(
        string="Kanban Remaining",
        group_operator=False,
    )

    @api.model
    def web_read_group(
        self,
        domain,
        fields,
        groupby,
        limit=None,
        offset=0,
        orderby=False,
        lazy=True,
    ):
        """Inject custom SQL metric into grouped kanban results.

        Why override web_read_group instead of _web_read_group?
        web_read_group is the RPC endpoint called by the web client, and it
        returns a dictionary: {"groups": [...], "length": n}. So it is the
        clearest place to verify that the call happens and to inject values.
        """
        metric_fields = {
            "x_kanban_total_boq",
            "x_kanban_delivered",
            "x_kanban_remaining",
        }
        requested_metric_fields = {
            fname.split(":")[0]
            for fname in fields
            if fname.split(":")[0] in metric_fields
        }
        need_metric = bool(requested_metric_fields)

        _logger.warning(
            "ProjectProject.web_read_group called | fields=%s | groupby=%s | requested_metric_fields=%s | domain=%s",
            fields,
            groupby,
            sorted(requested_metric_fields),
            domain,
        )

        # Do not let the normal read_group try to aggregate our virtual metric.
        clean_fields = [
            fname
            for fname in fields
            if fname.split(":")[0] not in metric_fields
        ]

        result = super().web_read_group(
            domain,
            clean_fields,
            groupby,
            limit=limit,
            offset=offset,
            orderby=orderby,
            lazy=lazy,
        )

        if not need_metric or not groupby:
            return result

        groupby_token = groupby[0]
        groupby_field = groupby_token.split(":")[0].split(".")[0]
        if groupby_field != "last_update_status":
            return result

        for group in result.get("groups", []):
            group_domain = group.get("__domain", domain)
            metrics = self._get_sql_metrics_for_domain(group_domain)
            _logger.warning(
                "ProjectProject.web_read_group group metrics | groupby=%s | group_domain=%s | metrics=%s | group=%s",
                groupby,
                group_domain,
                metrics,
                group,
            )
            for field_name in requested_metric_fields:
                group[field_name] = metrics.get(field_name, 0.0)

        return result

    def _get_sql_metrics_for_domain(self, domain):
        """Compute BOQ-based metrics for projects matching the provided domain."""
        project_ids = self.search(domain).ids
        _logger.warning(
            "ProjectProject._get_sql_metrics_for_domain | domain=%s | project_ids=%s",
            domain,
            project_ids,
        )
        if not project_ids:
            return {
                "x_kanban_total_boq": 0.0,
                "x_kanban_delivered": 0.0,
                "x_kanban_remaining": 0.0,
            }

        self.flush_model(["id", "last_update_status"])

        self.env.cr.execute(
            """
            SELECT
                COALESCE(SUM(
                    CASE
                        WHEN pbq.is_parent = TRUE THEN pbq.subtotal_untaxed
                        ELSE 0
                    END
                ), 0)::float AS total_boq,
                COALESCE(SUM(
                    CASE
                        WHEN pbq.is_parent = FALSE
                             OR (
                                 pbq.is_parent = TRUE
                                 AND NOT EXISTS (
                                     SELECT 1
                                     FROM project_bill_quantities child
                                     WHERE child.project_id = pbq.project_id
                                       AND child.is_parent = FALSE
                                       AND child.parent_id = pbq.id
                                 )
                             )
                        THEN pbq.subtotal_untaxed
                        ELSE 0
                    END
                ), 0)::float AS delivered
            FROM project_project p
            LEFT JOIN project_bill_quantities pbq
                ON pbq.project_id = p.id
            WHERE p.id = ANY(%s)
            """,
            [project_ids],
        )

        total_boq, delivered = self.env.cr.fetchone() or (0.0, 0.0)
        return {
            "x_kanban_total_boq": total_boq or 0.0,
            "x_kanban_delivered": delivered or 0.0,
            "x_kanban_remaining": (total_boq or 0.0) - (delivered or 0.0),
        }
