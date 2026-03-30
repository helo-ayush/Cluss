const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// This middleware ensures that the request has a valid Clerk session token.
// It populates req.auth with the user's information (userId, etc).
const requireAuth = ClerkExpressRequireAuth({
    // You can add options here if needed
});

module.exports = { requireAuth };
