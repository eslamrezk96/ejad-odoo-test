# Project Kanban SQL Metric

Odoo 17 demo module.

It shows a custom SQL metric beside each `project.project` kanban group count when grouped by `stage_id`.

Demo metric:

- `Count(project.task)` inside projects of each project stage.

Where to customize:

- Replace the SQL in `models/project_project.py`, method `_get_sql_metric_by_stage`.
- Keep the return shape as `{stage_id: metric_value}`.

Install:

1. Copy `project_kanban_sql_metric` into your custom addons path.
2. Restart Odoo.
3. Update Apps List.
4. Install or upgrade `Project Kanban SQL Metric`.
5. Open Project > Projects.
6. Group By > Stage.
