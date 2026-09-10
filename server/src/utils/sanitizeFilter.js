// Express's default "qs" query parser turns bracket-notation query strings like
// ?category[$ne]=null into objects: req.query.category becomes { $ne: null }
// instead of a plain string. If that object lands straight in a Mongoose filter,
// it's a NoSQL operator injection. This helper only accepts real strings for
// fields that get used directly in a filter — anything else is dropped.
export const asString = (value) => (typeof value === "string" ? value : undefined);