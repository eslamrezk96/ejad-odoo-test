{
    "name": "Project Kanban SQL Metric",
    "version": "17.0.1.0.1",
    "category": "Project",
    "summary": "Show custom SQL metric beside kanban group count",
    "depends": ["project", "web"],
    "data": [
        "security/ir.model.access.csv",
        "views/project_project_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "project_kanban_sql_metric/static/src/js/project_kanban_sql_metric.js",
            "project_kanban_sql_metric/static/src/xml/project_kanban_sql_metric.xml",
        ],
    },
    "installable": True,
    "application": False,
    "license": "LGPL-3",
}
