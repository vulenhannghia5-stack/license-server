const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

let licenses = [];

// Load license từ file
function loadLicenses() {
    if (fs.existsSync("licenses.json")) {
        licenses = JSON.parse(fs.readFileSync("licenses.json"));
    } else {
        licenses = [];
    }
}

// Lưu license ra file
function saveLicenses() {
    fs.writeFileSync("licenses.json", JSON.stringify(licenses, null, 2));
}

// API lấy danh sách license
app.get("/api/list", (req, res) => {
    res.json(licenses);
});

// API kiểm tra license
app.post("/api/verify", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ valid: false, message: "Missing name" });

    const license = licenses.find(l => l.name.toLowerCase() === name.toLowerCase());
    if (!license) return res.json({ valid: false, message: "License not found" });

    if (license.expiresAt === "never") {
        return res.json({ valid: true, expiresAt: "never" });
    }

    const expiry = new Date(license.expiresAt).getTime();
    if (expiry > Date.now()) {
        return res.json({ valid: true, expiresAt: license.expiresAt });
    } else {
        return res.json({ valid: false, message: "License expired" });
    }
});

// API thêm hoặc gia hạn license
app.post("/api/add", (req, res) => {
    const { name, expiresAt } = req.body;
    if (!name || !expiresAt) return res.status(400).json({ message: "Missing name or expiresAt" });

    const existing = licenses.find(l => l.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        existing.expiresAt = expiresAt;
    } else {
        licenses.push({ name, expiresAt });
    }

    saveLicenses();
    res.json({ message: "License added/updated" });
});

// API xóa license
app.post("/api/delete", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Missing name" });

    licenses = licenses.filter(l => l.name.toLowerCase() !== name.toLowerCase());
    saveLicenses();
    res.json({ message: "License deleted" });
});

// Trang quản lý license
app.get("/manage", (req, res) => {
    res.sendFile(path.join(__dirname, "license-manager.html"));
});

// Load license khi khởi động
loadLicenses();

app.listen(PORT, () => {
    console.log(`License server running on port ${PORT}`);
});
