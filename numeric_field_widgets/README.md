# Numeric Field Widgets (Odoo 17)

Widgets:
- `numeric_integer`
- `numeric_float`

Example:

```xml
<field name="quantity"
       widget="numeric_integer"
       required="1"
       options="{'allow_negative': False}"/>

<field name="amount"
       widget="numeric_float"
       required="1"
       options="{'allow_negative': False}"/>
```

Behavior:
- `0` / `0.0` are displayed as empty.
- If `required="1"`, zero/empty marks the field invalid and prevents save.
- Text and invalid symbols are blocked.
- Invalid paste/drop payloads are rejected completely.
- `allow_negative` defaults to `True`; set it to `False` to reject negative values.
- Float parsing uses Odoo's normal locale-aware parser.


Required validation is displayed only after a save/validity attempt; opening an empty form does not immediately mark the field invalid.
