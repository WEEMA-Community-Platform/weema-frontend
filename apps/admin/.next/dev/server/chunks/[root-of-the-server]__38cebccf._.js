module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/packages/auth/src/api.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createAuthApiClient",
    ()=>createAuthApiClient
]);
function buildUrl(baseUrl, path) {
    return `${baseUrl.replace(/\/$/, "")}${path}`;
}
async function parseJson(response) {
    const payload = await response.json().catch(()=>null);
    if (!response.ok) {
        const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string" && payload.message || `Request failed with status ${response.status}`;
        throw new Error(message);
    }
    return payload;
}
function createAuthApiClient(config) {
    const { baseUrl, fetchInit } = config;
    return {
        async login (input) {
            const response = await fetch(buildUrl(baseUrl, "/login"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                ...fetchInit,
                body: JSON.stringify(input)
            });
            return parseJson(response);
        },
        async requestOtp (email) {
            const response = await fetch(buildUrl(baseUrl, `/request-otp/${encodeURIComponent(email)}`), {
                method: "PATCH",
                credentials: "include",
                ...fetchInit
            });
            return parseJson(response);
        },
        async verifyOtp (email, otp) {
            const response = await fetch(buildUrl(baseUrl, `/verify-otp/${encodeURIComponent(email)}/${encodeURIComponent(otp)}`), {
                method: "GET",
                credentials: "include",
                ...fetchInit
            });
            return parseJson(response);
        },
        async resetPassword (input) {
            const response = await fetch(buildUrl(baseUrl, "/reset-password"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                ...fetchInit,
                body: JSON.stringify(input)
            });
            return parseJson(response);
        },
        async refresh () {
            const response = await fetch(buildUrl(baseUrl, "/refresh"), {
                method: "POST",
                credentials: "include",
                ...fetchInit
            });
            return parseJson(response);
        },
        async logout () {
            const response = await fetch(buildUrl(baseUrl, "/logout"), {
                method: "POST",
                credentials: "include",
                ...fetchInit
            });
            return parseJson(response);
        }
    };
}
}),
"[project]/packages/auth/src/index.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ADMIN_ALLOWED_ROLES",
    ()=>ADMIN_ALLOWED_ROLES,
    "ROLE_HOME_PATHS",
    ()=>ROLE_HOME_PATHS,
    "buildBearerToken",
    ()=>buildBearerToken,
    "getHomePathForRole",
    ()=>getHomePathForRole,
    "getRoleFromToken",
    ()=>getRoleFromToken,
    "hasAllowedRole",
    ()=>hasAllowedRole,
    "normalizeRole",
    ()=>normalizeRole,
    "parseJwtPayload",
    ()=>parseJwtPayload
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/auth/src/api.ts [app-route] (ecmascript)");
;
const ROLE_HOME_PATHS = {
    admin: "/",
    cluster_admin: "/",
    facilitator: "/"
};
const ADMIN_ALLOWED_ROLES = [
    "admin"
];
function buildBearerToken(accessToken) {
    return `Bearer ${accessToken}`;
}
function normalizeRole(rawRole) {
    if (!rawRole) return null;
    const normalized = rawRole.trim().toLowerCase();
    if (normalized === "admin" || normalized === "role_admin" || normalized === "role_super_admin") {
        return "admin";
    }
    if (normalized === "cluster_admin" || normalized === "cluster-admin") {
        return "cluster_admin";
    }
    if (normalized === "role_cluster_admin") return "cluster_admin";
    if (normalized === "facilitator") return "facilitator";
    if (normalized === "role_facilitator") return "facilitator";
    return null;
}
function parseJwtPayload(token) {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    try {
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padding = base64.length % 4;
        const padded = padding ? base64 + "=".repeat(4 - padding) : base64;
        const decoded = Buffer.from(padded, "base64").toString("utf8");
        return JSON.parse(decoded);
    } catch  {
        return null;
    }
}
function getRoleFromToken(token) {
    const payload = parseJwtPayload(token);
    if (!payload) return null;
    const singleRole = normalizeRole(payload.role);
    if (singleRole) return singleRole;
    if (Array.isArray(payload.roles)) {
        for (const role of payload.roles){
            const normalized = normalizeRole(role);
            if (normalized) return normalized;
        }
    }
    return null;
}
function hasAllowedRole(role, allowedRoles) {
    return !!role && allowedRoles.includes(role);
}
function getHomePathForRole(role) {
    return ROLE_HOME_PATHS[role];
}
}),
"[project]/apps/admin/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ACCESS_TOKEN_COOKIE",
    ()=>ACCESS_TOKEN_COOKIE,
    "API_BASE_URL",
    ()=>API_BASE_URL,
    "AUTH_API_BASE_URL",
    ()=>AUTH_API_BASE_URL,
    "AUTH_API_PREFIX",
    ()=>AUTH_API_PREFIX,
    "AUTH_APP_URL",
    ()=>AUTH_APP_URL,
    "REFRESH_TOKEN_COOKIE",
    ()=>REFRESH_TOKEN_COOKIE,
    "getSecureCookieOptions",
    ()=>getSecureCookieOptions,
    "getTokenRole",
    ()=>getTokenRole,
    "isAllowedAdminRole",
    ()=>isAllowedAdminRole
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/auth/src/index.ts [app-route] (ecmascript) <locals>");
;
const ACCESS_TOKEN_COOKIE = "weema_access_token";
const REFRESH_TOKEN_COOKIE = "weema_refresh_token";
const AUTH_APP_URL = process.env.NEXT_PUBLIC_AUTH_APP_URL ?? "http://localhost:3000";
const AUTH_API_BASE_URL = process.env.AUTH_API_BASE_URL ?? "http://159.65.220.133:8084";
const API_BASE_URL = process.env.API_BASE_URL ?? process.env.AUTH_API_BASE_URL ?? "http://159.65.220.133:8084";
const AUTH_API_PREFIX = "/api/auth";
function getSecureCookieOptions(expiresAt) {
    return {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt
    };
}
function isAllowedAdminRole(role) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["hasAllowedRole"])(role, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ADMIN_ALLOWED_ROLES"]);
}
function getTokenRole(token) {
    if (!token) return null;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getRoleFromToken"])(token);
}
}),
"[project]/apps/admin/app/api/auth/_lib.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildAuthBackendUrl",
    ()=>buildAuthBackendUrl,
    "buildBackendUrl",
    ()=>buildBackendUrl,
    "safeJson",
    ()=>safeJson
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/admin/lib/auth.ts [app-route] (ecmascript)");
;
function buildAuthBackendUrl(pathname) {
    const base = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AUTH_API_BASE_URL"].replace(/\/$/, "");
    return `${base}${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AUTH_API_PREFIX"]}${pathname}`;
}
function buildBackendUrl(pathname) {
    const base = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["API_BASE_URL"].replace(/\/$/, "");
    const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return `${base}${normalizedPath}`;
}
async function safeJson(response) {
    return await response.json().catch(()=>null);
}
}),
"[project]/apps/admin/app/api/base-data/_lib.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildPathWithQuery",
    ()=>buildPathWithQuery,
    "forwardAuthorizedRequest",
    ()=>forwardAuthorizedRequest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_@babel+core@7.29.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_@babel+core@7.29.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/admin/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$app$2f$api$2f$auth$2f$_lib$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/admin/app/api/auth/_lib.ts [app-route] (ecmascript)");
;
;
;
;
async function forwardAuthorizedRequest({ path, method, body }) {
    const accessToken = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])()).get(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ACCESS_TOKEN_COOKIE"])?.value;
    if (!accessToken) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: "Unauthorized"
        }, {
            status: 401
        });
    }
    const backendResponse = await fetch((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$app$2f$api$2f$auth$2f$_lib$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildBackendUrl"])(path), {
        method,
        headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store"
    });
    const payload = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$app$2f$api$2f$auth$2f$_lib$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["safeJson"])(backendResponse);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(payload, {
        status: backendResponse.status
    });
}
function buildPathWithQuery(request, basePath) {
    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.toString();
    return query ? `${basePath}?${query}` : basePath;
}
}),
"[project]/apps/admin/app/api/region/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_@babel+core@7.29.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$app$2f$api$2f$base$2d$data$2f$_lib$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/admin/app/api/base-data/_lib.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$app$2f$api$2f$base$2d$data$2f$_lib$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forwardAuthorizedRequest"])({
        method: "GET",
        path: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$app$2f$api$2f$base$2d$data$2f$_lib$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildPathWithQuery"])(request, "/api/region")
    });
}
async function POST(request) {
    const body = await request.json().catch(()=>null);
    if (!body?.name) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: "Region name is required."
        }, {
            status: 400
        });
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$app$2f$api$2f$base$2d$data$2f$_lib$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forwardAuthorizedRequest"])({
        method: "POST",
        path: "/api/region",
        body
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__38cebccf._.js.map