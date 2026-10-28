function flush_attrs() {
    attrs = ""
}

function regex_escape(value, escaped) {
    escaped = value
    gsub(/[][\\.^$*+?(){}|]/, "\\\\&", escaped)
    return escaped
}

BEGIN {
    escaped_symbol = regex_escape(sym)
    declaration = "(struct|class|enum|protocol|actor|func|var|let|case|typealias|macro)[^A-Za-z0-9_]+" escaped_symbol "([^A-Za-z0-9_]|$)"
    scope = ""
    attrs = ""
    count = 0
}

{
    raw = $0
    has_declaration = raw ~ /(^|[[:space:]])(extension|struct|class|enum|protocol|actor|func|var|let|case|typealias|macro|init|subscript)([[:space:]<(]|$)/

    # Attribute-only lines belong to the next declaration. Swift interfaces
    # also put attributes and declarations on the same line; those must not be
    # skipped.
    if (raw ~ /^[[:space:]]*@/ && !has_declaration) {
        attrs = attrs raw "\n"
        next
    }

    if (raw ~ /^[[:space:]]*$/) {
        flush_attrs()
        next
    }

    # Track only a top-level declaration. This is stable for generated
    # .swiftinterface files and avoids claiming that the previous extension
    # encloses a new top-level type.
    top_type = (raw !~ /^[[:space:]]/ && raw ~ /(^|[[:space:]])(extension|struct|class|enum|protocol|actor)[[:space:]]/)

    hit = 0
    if (members == 1) {
        if (index(raw, sym) > 0) hit = 1
    } else if (sym == "init") {
        if (raw ~ /(^|[[:space:]])init[[:space:]]*\(/) hit = 1
    } else if (sym == "subscript") {
        if (raw ~ /(^|[[:space:]])subscript[[:space:]]*[<(]/) hit = 1
    } else if (raw ~ declaration) {
        hit = 1
    }

    if (hit && owner != "" && index(scope, owner) == 0 && index(raw, owner) == 0) {
        hit = 0
    }

    if (hit) {
        if (!top_type && scope != "") printf "%s\n", scope
        printf "%s", attrs
        body = raw
        sub(/^[[:space:]]*/, "", body)
        sub(/[[:space:]]*\{[[:space:]]*$/, "", body)
        printf "    %s\n", body
        printf "    -- %s:%d\n\n", module, NR
        count++
    }

    if (top_type) {
        scope = raw
        sub(/[[:space:]]*\{[[:space:]]*$/, "", scope)
    }

    flush_attrs()
}

END {
    exit (count > 0 ? 0 : 1)
}
