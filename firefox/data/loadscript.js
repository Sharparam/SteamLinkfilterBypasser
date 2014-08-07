// This file *should* only ever be called when Firefox is launched with a linkfilter URL

// Get the full page URL
var href = window.location.href;

// Extract the actual URL
var fixed = href.replace(/^.*?\?url=(.*)/i, "$1");

// Redirect to the fixed URL
window.location.replace(fixed);
